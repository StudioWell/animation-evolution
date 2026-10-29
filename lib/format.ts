/** Formatting helpers shared by server and client. */

/** 155 -> "02:35", 768 -> "12:48", 5076 -> "01:24:36". */
export function formatDuration(totalSeconds: number | null | undefined): string | null {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const s = Math.round(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Spoken form for screen readers: "12 minutes 48 seconds". */
export function durationLabel(totalSeconds: number | null | undefined): string | null {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const s = Math.round(totalSeconds);
  const parts: string[] = [];
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (sec && !h) parts.push(`${sec} second${sec === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** Parse ISO 8601 durations from the YouTube Data API, e.g. "PT1H24M36S", "P1DT2H". */
export function parseIsoDuration(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!match) return null;
  const [, d, h, m, s] = match;
  const total = Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
  return total > 0 ? Math.round(total) : null;
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatViews(count: number | null | undefined): string | null {
  if (count == null || !Number.isFinite(count) || count < 0) return null;
  return `${compact.format(count)} views`;
}

const dateFormat = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormat.format(date);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Join class names, skipping falsy values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Stable, URL-safe key for a creator name, used by the Creator filter
 * (?by=richard-oud). Non-Latin names get a short hash so they stay URL-safe.
 */
export function creatorKey(name: string): string {
  const ascii = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  // FNV-1a over the full name keeps keys distinct for names that share a Latin part.
  let h = 0x811c9dc5;
  for (const ch of name) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const hash = h.toString(36).slice(0, 6);
  const latinShare = ascii.replace(/-/g, "").length / Math.max(1, name.replace(/\s/g, "").length);
  return ascii.length >= 2 && latinShare > 0.6 ? ascii : `c-${hash}`;
}
