import type { Metadata } from "next";
import { LibraryPage } from "@/components/library/LibraryPage";

export const metadata: Metadata = {
  title: "Video Library",
  description:
    "Search every reference, tutorial, breakdown and motion-capture video by title, creator, game, anime, technique, movement and tags.",
};

export default async function LibraryIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <LibraryPage kind="all" searchParams={await searchParams} />;
}
