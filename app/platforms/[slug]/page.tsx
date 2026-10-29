import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformView } from "@/components/platforms/PlatformView";
import { getPlatform, isPlatformTutorial, PLATFORMS, sortForLearning } from "@/lib/config/platforms";
import { getLibrary } from "@/lib/sources/library";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PLATFORMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const platform = getPlatform((await params).slug);
  if (!platform) return {};
  return {
    title: `${platform.name} tutorials`,
    description: `Animation tutorials for ${platform.name}, from beginner to advanced, linked to their original creators.`,
  };
}

export default async function PlatformPage({ params }: Props) {
  const { slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) notFound();
  const library = await getLibrary();
  const tutorials = library.filter((r) => isPlatformTutorial(r, platform)).sort(sortForLearning);
  const references = library
    .filter((r) => r.software.includes(platform.software) && !isPlatformTutorial(r, platform) && r.availability !== "unavailable")
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 12);
  return <PlatformView slug={slug} tutorials={tutorials} references={references} />;
}
