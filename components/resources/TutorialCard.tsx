"use client";

import type { Resource } from "@/lib/types";
import { VideoCard } from "@/components/resources/VideoCard";

/** Kept for existing imports; every card in the library is a VideoCard. */
export function TutorialCard(props: { resource: Resource; priority?: boolean; className?: string }) {
  return <VideoCard {...props} />;
}
