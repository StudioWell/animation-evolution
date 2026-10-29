import "server-only";

import { createHash } from "node:crypto";
import { OverloadedError } from "@/lib/security/concurrency";
import { logEvent } from "@/lib/security/log";
import { rateLimiter, type LimitPolicy } from "@/lib/security/rate-limit";

/**
 * Shared guard for API route handlers:
 *  - GET only, bounded URL length (request-size limit for query strings)
 *  - same-origin only: cross-site browser requests are refused (strict CORS; no ACAO header is ever sent)
 *  - per-client and global rate limits with Retry-After
 *  - hard timeout per request
 *  - errors are returned as JSON without stack traces; details go to the server log
 */

/**
 * Determine the client address for rate limiting.
 *
 * Forwarding headers are only meaningful when a trusted proxy sets them, so the
 * header to read is configured explicitly via TRUSTED_IP_HEADER:
 *   - "cf-connecting-ip"  behind Cloudflare
 *   - "x-forwarded-for"   on Vercel and most load balancers (first entry is used)
 *   - "x-real-ip"         behind nginx configured with real_ip
 *   - "none"              direct exposure (all clients share one bucket; rely on the edge)
 */
export function getClientIp(headers: Headers): string {
  const configured = (process.env.TRUSTED_IP_HEADER ?? "x-forwarded-for").toLowerCase().trim();
  if (configured === "none") return "shared";
  const value = headers.get(configured);
  if (!value) return "unknown";
  const first = value.split(",")[0]?.trim() ?? "";
  // Accept only plausible IPv4/IPv6 strings to avoid unbounded keys.
  if (!/^[0-9a-fA-F:.]{2,45}$/.test(first)) return "invalid";
  return first;
}

/** Salted hash so logs and limiter keys never store raw addresses. */
export function hashClientId(ip: string): string {
  const salt = process.env.LOG_SALT ?? "animation-evolution";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

const MAX_URL_LENGTH = 2048;
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const baseHeaders = {
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};

export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...baseHeaders, ...init.headers },
  });
}

function errorResponse(status: number, code: string, message: string, headers: Record<string, string> = {}): Response {
  return json({ error: { code, message } }, { status, headers: { "cache-control": "no-store", ...headers } });
}

function isAllowedOrigin(request: Request): boolean {
  // Browsers send Sec-Fetch-Site on every request; refuse cross-site callers.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    const extra = (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const origin = request.headers.get("origin");
    return origin !== null && extra.includes(origin);
  }
  return true;
}

export interface GuardOptions {
  name: string;
  clientPolicy: LimitPolicy;
  globalPolicy: LimitPolicy;
}

export function guardedGet(options: GuardOptions, handler: (request: Request, url: URL) => Promise<Response>) {
  return async function GET(request: Request): Promise<Response> {
    const started = Date.now();
    if (request.url.length > MAX_URL_LENGTH) {
      return errorResponse(414, "uri_too_long", "The request URL is too long.");
    }
    const url = new URL(request.url);
    const client = hashClientId(getClientIp(request.headers));

    if (!isAllowedOrigin(request)) {
      logEvent("warn", "cross_site_blocked", { route: options.name, client });
      return errorResponse(403, "forbidden", "Cross-site requests are not allowed.");
    }

    const global = rateLimiter.check(`global:${options.name}`, options.globalPolicy);
    const perClient = global.allowed ? rateLimiter.check(`${options.name}:${client}`, options.clientPolicy) : global;
    if (!global.allowed || !perClient.allowed) {
      logEvent("warn", "rate_limited", { route: options.name, client, scope: global.allowed ? "client" : "global" });
      return errorResponse(429, "rate_limited", "Too many searches. Wait a moment and try again.", {
        "retry-after": String(Math.max(1, perClient.retryAfter)),
      });
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        handler(request, url),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new ApiError(503, "timeout", "The search took too long. Try again.")),
            REQUEST_TIMEOUT_MS,
          );
        }),
      ]);
      response.headers.set("x-ratelimit-remaining", String(perClient.remaining));
      response.headers.set("server-timing", `app;dur=${Date.now() - started}`);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) logEvent("info", "invalid_request", { route: options.name, client, code: error.code });
        return errorResponse(error.status, error.code, error.message);
      }
      if (error instanceof OverloadedError) {
        logEvent("warn", "overloaded", { route: options.name });
        return errorResponse(503, "busy", "The server is busy. Try again in a few seconds.", { "retry-after": "5" });
      }
      logEvent("error", "unhandled_error", {
        route: options.name,
        message: error instanceof Error ? error.message : String(error),
      });
      return errorResponse(500, "internal", "Something went wrong on our side. Try again.");
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}

/** Reject any other HTTP method with 405 (Next.js does this by default; kept explicit for clarity). */
export function methodNotAllowed(): Response {
  return errorResponse(405, "method_not_allowed", "Only GET is supported.", { allow: "GET" });
}
