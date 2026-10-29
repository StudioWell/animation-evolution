import { isPlatformTutorial, PLATFORMS } from "@/lib/config/platforms";
import { getLibrary } from "@/lib/sources/library";

/** Tutorials per platform, for the Platforms cards. */
export async function platformCounts(): Promise<Record<string, number>> {
  const library = await getLibrary();
  return Object.fromEntries(PLATFORMS.map((p) => [p.slug, library.filter((r) => isPlatformTutorial(r, p)).length]));
}
