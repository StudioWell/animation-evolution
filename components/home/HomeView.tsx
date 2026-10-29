"use client";

import { Carousel } from "@/components/home/Carousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { HomeSearch } from "@/components/home/HomeSearch";
import { OnionTitle } from "@/components/home/OnionTitle";
import { Section } from "@/components/home/Section";
import { ReferenceCard } from "@/components/resources/ReferenceCard";
import { TutorialCard } from "@/components/resources/TutorialCard";
import { useI18n } from "@/components/settings/useI18n";
import { libraryHref } from "@/lib/search/query-string";
import type { Resource } from "@/lib/types";

/** Homepage layout. Data is chosen on the server (app/page.tsx); text follows the visitor's language. */
export function HomeView({
  library,
  featured,
  trending,
  combat,
  movement,
  physics,
  recommended,
  recent,
}: {
  library: Resource[];
  featured: Resource[];
  trending: { items: Resource[]; rankedByViews: boolean };
  combat: Resource[];
  movement: Resource[];
  physics: Resource[];
  recommended: Resource[];
  recent: Resource[];
}) {
  const { t } = useI18n();

  const rows: { id: string; title: string; desc: string; href?: string; items: Resource[] }[] = [
    { id: "combat", title: t("home.combat.title"), desc: t("home.combat.desc"), href: libraryHref("all", { group: "combat-weapons" }), items: combat },
    { id: "movement", title: t("home.movement.title"), desc: t("home.movement.desc"), href: libraryHref("all", { group: "character-movement" }), items: movement },
    { id: "physics", title: t("home.physics.title"), desc: t("home.physics.desc"), href: libraryHref("all", { group: "body-mechanics-physics" }), items: physics },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section aria-label={t("home.search.label")} className="ae-hero relative pt-12 pb-14 sm:pt-16 sm:pb-16 lg:pt-20">
        <OnionTitle text="Animation Evolution" />
        <p className="ae-hero-line stretch-semi mt-4 text-[clamp(1.1rem,2.2vw,1.45rem)] text-muted" style={{ ["--i" as string]: 1 }}>
          {t("home.subtitle")}
        </p>
        <div className="ae-hero-line mt-8" style={{ ["--i" as string]: 2 }}>
          <HomeSearch />
        </div>
      </section>

      <div className="flex flex-col gap-16 sm:gap-20">
        {featured.length > 0 && (
          <Section id="featured" title={t("home.featured.title")} description={t("home.featured.desc")} viewAllHref="/library">
            <Carousel label={t("home.featured.title")}>
              {featured.map((r, i) => (
                <ReferenceCard key={r.id} resource={r} priority={i < 2} />
              ))}
            </Carousel>
          </Section>
        )}

        <Section
          id="categories"
          band
          title={t("home.categories.title")}
          description={t("home.categories.desc")}
          viewAllHref="/categories"
          viewAllLabel={t("home.categories.all")}
        >
          <CategoryGrid references={library} />
        </Section>

        {trending.items.length > 0 && (
          <Section
            id="trending"
            band
            title={t("home.trending.title")}
            description={t(trending.rankedByViews ? "home.trending.desc.views" : "home.trending.desc.editorial")}
            viewAllHref={libraryHref("all", { types: ["breakdown"], sort: "popular" })}
          >
            <Carousel label={t("home.trending.title")}>
              {trending.items.map((r) => (
                <ReferenceCard key={r.id} resource={r} />
              ))}
            </Carousel>
          </Section>
        )}

        {rows.map(
          (row) =>
            row.items.length > 0 && (
              <Section key={row.id} id={row.id} title={row.title} description={row.desc} viewAllHref={row.href}>
                <Carousel label={row.title}>
                  {row.items.map((r) => (
                    <ReferenceCard key={r.id} resource={r} />
                  ))}
                </Carousel>
              </Section>
            ),
        )}

        {recommended.length > 0 && (
          <Section id="tutorials" band title={t("home.tutorials.title")} description={t("home.tutorials.desc")} viewAllHref="/tutorials">
            <Carousel label={t("home.tutorials.title")}>
              {recommended.map((r) => (
                <TutorialCard key={r.id} resource={r} />
              ))}
            </Carousel>
          </Section>
        )}

        {recent.length > 0 && (
          <Section id="recent" title={t("home.recent.title")} description={t("home.recent.desc")} viewAllHref={libraryHref("all", { sort: "added" })}>
            <Carousel label={t("home.recent.title")}>
              {recent.map((r) =>
                r.kind === "reference" ? <ReferenceCard key={r.id} resource={r} /> : <TutorialCard key={r.id} resource={r} />,
              )}
            </Carousel>
          </Section>
        )}
      </div>
    </div>
  );
}
