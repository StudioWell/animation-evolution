import { OUTBOUND_API_HOSTS } from "@/lib/config/sources";
import { parseSafeUrl } from "@/lib/security/url";

/**
 * The only way server code talks to the internet. Guards against SSRF by:
 *  - allowing https to an explicit host allowlist only (no user-supplied hosts)
 *  - refusing redirects (a redirect could point anywhere)
 *  - enforcing a timeout and a response size cap
 *  - requiring a JSON response
 */

export class OutboundError extends Error {
  constructor(
    message: string,
    readonly kind: "blocked" | "timeout" | "http" | "too-large" | "bad-response" | "network",
    readonly status?: number,
  ) {
    super(message);
    this.name = "OutboundError";
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}

export async function safeFetchJson<T = unknown>(rawUrl: string, options: SafeFetchOptions = {}): Promise<T> {
  const { timeoutMs = 6000, maxBytes = 1_000_000, fetchImpl = fetch } = options;

  const parsed = parseSafeUrl(rawUrl);
  if (!parsed.ok || !(OUTBOUND_API_HOSTS as readonly string[]).includes(parsed.url.hostname)) {
    throw new OutboundError("Outbound host not allowed", "blocked");
  }

  let response: Response;
  try {
    response = await fetchImpl(parsed.url, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new OutboundError("Upstream timed out", "timeout");
    }
    throw new OutboundError("Upstream request failed", "network");
  }

  if (!response.ok) {
    throw new OutboundError(`Upstream responded ${response.status}`, "http", response.status);
  }

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new OutboundError("Unexpected upstream content type", "bad-response");
  }

  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new OutboundError("Upstream response too large", "too-large");

  const text = await readLimited(response, maxBytes);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new OutboundError("Upstream returned invalid JSON", "bad-response");
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return response.text();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new OutboundError("Upstream response too large", "too-large");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}
