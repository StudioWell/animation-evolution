import { HomeView } from "@/components/home/HomeView";
import { byGroup, featured, recentlyAdded, trendingStudies } from "@/lib/home";
import { getLibrary } from "@/lib/sources/library";

export default async function HomePage() {
  const library = await getLibrary();
  const references = library.filter((r) => r.kind === "reference");
  const tutorials = library.filter((r) => r.kind === "tutorial");
  const featuredRefs = featured(references);
  const shown = new Set(featuredRefs.map((r) => r.id));

  return (
    <HomeView
      library={library}
      featured={featuredRefs}
      trending={trendingStudies(library, 10, shown)}
      combat={byGroup(library, "combat-weapons")}
      movement={byGroup(library, "character-movement")}
      physics={byGroup(library, "body-mechanics-physics")}
      recommended={featured(tutorials, 10)}
      recent={recentlyAdded(library)}
    />
  );
}
