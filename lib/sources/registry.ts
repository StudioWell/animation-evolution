import "server-only";

import type { LiveSearchAdapter } from "@/lib/sources/types";
import { youtubeAdapter } from "@/lib/sources/youtube";

/**
 * Registered live adapters. The curated library is always searched locally;
 * these add live results from external platforms when configured.
 */
export const LIVE_ADAPTERS: LiveSearchAdapter[] = [youtubeAdapter];

export function primaryLiveAdapter(): LiveSearchAdapter | null {
  return LIVE_ADAPTERS.find((a) => a.isConfigured()) ?? null;
}

export function liveSearchEnabled(): boolean {
  return primaryLiveAdapter() !== null;
}
