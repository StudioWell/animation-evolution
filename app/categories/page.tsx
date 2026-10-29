import type { Metadata } from "next";
import { CategoriesView } from "@/components/pages/CategoriesView";
import { getLibrary } from "@/lib/sources/library";
import { platformCounts } from "@/lib/sources/platforms";

export const metadata: Metadata = {
  title: "Categories",
  description: "Eight groups — movement, combat, first-person (FPS), body mechanics, acting, principles, cinematics and workflows — plus tutorials by platform: Roblox Studio, Blender, Maya and Cinema 4D.",
};

export default async function CategoriesPage() {
  const library = await getLibrary();
  const counts: Record<string, number> = {};
  for (const r of library) {
    if (r.availability === "unavailable") continue;
    for (const c of r.categories) counts[c] = (counts[c] ?? 0) + 1;
  }
  return <CategoriesView counts={counts} platformCounts={await platformCounts()} />;
}
