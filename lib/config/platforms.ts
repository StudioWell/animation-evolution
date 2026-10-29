import type { Resource, Software } from "@/lib/types";

/**
 * The Platforms section: the tools people animate in. Each platform page lists
 * every tutorial tagged with that software. Names are shown as plain text with
 * a monogram — no product logos.
 */
export interface Platform {
  slug: string;
  software: Software;
  name: string;
  monogram: string;
  /** Hue for the monogram tile (kept warm and muted to sit in the dark theme). */
  hue: number;
}

export const PLATFORMS: Platform[] = [
  { slug: "roblox-studio", software: "roblox-studio", name: "Roblox Studio", monogram: "Rs", hue: 8 },
  { slug: "blender", software: "blender", name: "Blender", monogram: "Bl", hue: 28 },
  { slug: "maya", software: "maya", name: "Maya", monogram: "My", hue: 175 },
  { slug: "cinema-4d", software: "cinema-4d", name: "Cinema 4D", monogram: "C4", hue: 215 },
];

export function getPlatform(slug: string): Platform | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}

/** A learning resource for the platform: tutorials and breakdowns that list its software. */
export function isPlatformTutorial(resource: Resource, platform: Platform): boolean {
  if (!resource.software.includes(platform.software) || resource.availability === "unavailable") return false;
  return resource.kind === "tutorial" || resource.contentType === "tutorial" || resource.contentType === "breakdown";
}

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 } as const;

/** Beginner first, then intermediate, advanced and unrated; most-watched first within a level. */
export function sortForLearning(a: Resource, b: Resource): number {
  const la = a.difficulty ? LEVEL_ORDER[a.difficulty] : 3;
  const lb = b.difficulty ? LEVEL_ORDER[b.difficulty] : 3;
  return la - lb || (b.viewCount ?? 0) - (a.viewCount ?? 0);
}
