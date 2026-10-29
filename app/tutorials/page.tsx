import type { Metadata } from "next";
import { LibraryPage } from "@/components/library/LibraryPage";

export const metadata: Metadata = {
  title: "Tutorial Library",
  description: "Search animation tutorials by topic, software, level and length. Every tutorial opens on its original platform.",
};

export default async function TutorialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <LibraryPage kind="tutorial" searchParams={await searchParams} />;
}
