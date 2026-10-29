import type { Metadata } from "next";
import { LibraryPage } from "@/components/library/LibraryPage";

export const metadata: Metadata = {
  title: "Reference Library",
  description: "Search animation references and movement studies by action, category, type and length.",
};

export default async function ReferencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <LibraryPage kind="reference" searchParams={await searchParams} />;
}
