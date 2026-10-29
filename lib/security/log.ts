/**
 * Structured security/operations log. One JSON object per line so any log
 * drain (Vercel, Cloudflare Logpush, Datadog…) can alert on `event`.
 * Never log secrets, raw IPs or full upstream responses.
 */
type Level = "info" | "warn" | "error";

export type SecurityEvent =
  | "rate_limited"
  | "invalid_request"
  | "cross_site_blocked"
  | "overloaded"
  | "upstream_error"
  | "upstream_timeout"
  | "quota_exhausted"
  | "rejected_url"
  | "unhandled_error";

export function logEvent(level: Level, event: SecurityEvent, fields: Record<string, unknown> = {}): void {
  const entry = { ts: new Date().toISOString(), level, event, ...fields };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
