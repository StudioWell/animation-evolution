import type { SourceId } from "../types";

/**
 * Supported source platforms and the domains they are allowed to link to.
 * This is the configurable allowlist used to validate every outbound link.
 * To support a new platform: add an entry here, add a SourceId in lib/types.ts,
 * and (optionally) a search adapter in lib/sources/.
 */
export interface SourceConfig {
  id: SourceId;
  label: string;
  /** Exact hostnames links may point to. Subdomains are NOT implied. */
  hosts: string[];
  /** Short phrase used in "Opens … in a new tab" notices. */
  displayHost: string;
}

export const SOURCES: Record<SourceId, SourceConfig> = {
  youtube: {
    id: "youtube",
    label: "YouTube",
    hosts: ["www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be"],
    displayHost: "youtube.com",
  },
  vimeo: {
    id: "vimeo",
    label: "Vimeo",
    hosts: ["vimeo.com", "www.vimeo.com"],
    displayHost: "vimeo.com",
  },
  "blender-studio": {
    id: "blender-studio",
    label: "Blender Studio",
    hosts: ["studio.blender.org"],
    displayHost: "studio.blender.org",
  },
  "blender-manual": {
    id: "blender-manual",
    label: "Blender Manual",
    hosts: ["docs.blender.org"],
    displayHost: "docs.blender.org",
  },
  "roblox-creator-hub": {
    id: "roblox-creator-hub",
    label: "Roblox Creator Hub",
    hosts: ["create.roblox.com"],
    displayHost: "create.roblox.com",
  },
  wikipedia: {
    id: "wikipedia",
    label: "Wikipedia",
    hosts: ["en.wikipedia.org"],
    displayHost: "wikipedia.org",
  },
  github: {
    id: "github",
    label: "GitHub",
    hosts: ["github.com"],
    displayHost: "github.com",
  },
  sakugabooru: {
    id: "sakugabooru",
    label: "Sakugabooru",
    hosts: ["www.sakugabooru.com", "sakugabooru.com"],
    displayHost: "sakugabooru.com",
  },
};

export const SOURCE_IDS = Object.keys(SOURCES) as SourceId[];

/**
 * Hosts allowed to serve thumbnails. Mirrored in next.config.ts `images.remotePatterns`
 * so the image optimizer can never be used to fetch arbitrary URLs.
 */
export const THUMBNAIL_HOSTS = ["i.ytimg.com"] as const;

/** Frames this site serves itself (captured stills for archive clips), under /public/thumbs. */
export const LOCAL_THUMBNAIL_PREFIX = "/thumbs/";

/**
 * Hosts the server itself may contact (SSRF guard). Nothing else is ever fetched server-side.
 */
export const OUTBOUND_API_HOSTS = ["www.googleapis.com"] as const;

export function sourceLabel(id: SourceId): string {
  return SOURCES[id]?.label ?? id;
}
