import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlatformGrid } from "@/components/platforms/PlatformCard";
import { PLATFORMS } from "@/lib/config/platforms";
import { platformCounts } from "@/lib/sources/platforms";

export const metadata: Metadata = {
  title: "Platforms",
  description: "Animation tutorials by platform: Roblox Studio, Blender, Maya and Cinema 4D — from first keyframes to rigging and game animation.",
};

export default async function PlatformsPage() {
  const counts = await platformCounts();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <PageHeader title="platforms.title" intro="platforms.intro" />
      <PlatformGrid platforms={PLATFORMS} counts={counts} />
    </div>
  );
}
