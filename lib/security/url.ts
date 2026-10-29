import { SOURCES, THUMBNAIL_HOSTS } from "@/lib/config/sources";
import type { SourceId } from "@/lib/types";

const MAX_URL_LENGTH = 2048;
// Control characters, whitespace and characters that should never appear in a link we render.
const FORBIDDEN_CHARS = /[\u0000-\u001F\u007F\s<>"'`\\]/;
const IPV4_HOST = /^\d{1,3}(\.\d{1,3}){3}$/;

export type UrlCheck =
  | { ok: true; url: URL }
  | { ok: false; reason: "malformed" | "protocol" | "credentials" | "host" | "port" | "length" | "characters" };

/**
 * Strict parser for any URL we link to or load. Only https on standard ports,
 * no credentials, no IP-literal hosts, no control characters.
 */
export function parseSafeUrl(raw: unknown): UrlCheck {
  if (typeof raw !== "string") return { ok: false, reason: "malformed" };
  if (raw.length === 0 || raw.length > MAX_URL_LENGTH) return { ok: false, reason: "length" };
  if (FORBIDDEN_CHARS.test(raw)) return { ok: false, reason: "characters" };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "protocol" };
  if (url.username || url.password) return { ok: false, reason: "credentials" };
  if (url.port && url.port !== "443") return { ok: false, reason: "port" };
  const host = url.hostname.toLowerCase();
  if (IPV4_HOST.test(host) || host.startsWith("[") || !host.includes(".")) {
    return { ok: false, reason: "host" };
  }
  return { ok: true, url };
}

/** True if `raw` is a safe https URL whose host is allowlisted for `source`. */
export function isAllowedSourceUrl(raw: unknown, source: SourceId): boolean {
  const parsed = parseSafeUrl(raw);
  if (!parsed.ok) return false;
  const config = SOURCES[source];
  if (!config) return false;
  return config.hosts.includes(parsed.url.hostname.toLowerCase());
}

/** Find which configured source a URL belongs to, if any. */
export function detectSource(raw: unknown): SourceId | null {
  const parsed = parseSafeUrl(raw);
  if (!parsed.ok) return null;
  const host = parsed.url.hostname.toLowerCase();
  for (const config of Object.values(SOURCES)) {
    if (config.hosts.includes(host)) return config.id;
  }
  return null;
}

export function isAllowedThumbnailUrl(raw: unknown): boolean {
  if (typeof raw === "string" && /^\/thumbs\/[A-Za-z0-9_-]{1,64}\.webp$/.test(raw)) return true;
  const parsed = parseSafeUrl(raw);
  if (!parsed.ok) return false;
  return (THUMBNAIL_HOSTS as readonly string[]).includes(parsed.url.hostname.toLowerCase());
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeId(id: unknown): id is string {
  return typeof id === "string" && YOUTUBE_ID.test(id);
}

/** Canonical watch URL built from a validated id — never from untrusted strings. */
export function youtubeWatchUrl(id: string): string {
  if (!isValidYouTubeId(id)) throw new Error("Invalid YouTube video id");
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Official thumbnail on i.ytimg.com (permitted for display when linking to the video). */
export function youtubeThumbnail(id: string) {
  if (!isValidYouTubeId(id)) throw new Error("Invalid YouTube video id");
  return { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 };
}

/** Extract the video id from a YouTube URL, if it is one. */
export function youtubeIdFromUrl(raw: string): string | null {
  const parsed = parseSafeUrl(raw);
  if (!parsed.ok) return null;
  const { url } = parsed;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (SOURCES.youtube.hosts.includes(host)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] ?? null;
  }
  return isValidYouTubeId(id) ? id : null;
}
