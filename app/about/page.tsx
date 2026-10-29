import type { Metadata } from "next";
import { AboutView } from "@/components/pages/AboutView";
import { getLibrary } from "@/lib/sources/library";
import { liveSearchEnabled } from "@/lib/sources/registry";

export const metadata: Metadata = {
  title: "About",
  description: "What Animation Evolution is, where its resources come from, and how links work.",
};

export default async function AboutPage() {
  const library = await getLibrary();
  return (
    <AboutView
      references={library.filter((r) => r.kind === "reference").length}
      tutorials={library.filter((r) => r.kind === "tutorial").length}
      live={liveSearchEnabled()}
    />
  );
}
