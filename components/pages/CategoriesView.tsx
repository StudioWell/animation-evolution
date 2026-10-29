"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlatformGrid } from "@/components/platforms/PlatformCard";
import { PLATFORMS } from "@/lib/config/platforms";
import { useI18n } from "@/components/settings/useI18n";
import { CATEGORY_GROUPS } from "@/lib/config/categories";
import { cx } from "@/lib/format";
import { libraryHref } from "@/lib/search/query-string";

/** All eight groups and their categories, with live counts across the whole library. */
export function CategoriesView({ counts, platformCounts }: { counts: Record<string, number>; platformCounts: Record<string, number> }) {
  const { t, cat, group, groupDesc } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <PageHeader title="cats.title" intro="cats.intro" className="mb-0" />

      <nav aria-label={t("cats.jump")} className="ae-hero-line mt-8 flex flex-wrap gap-2 text-sm" style={{ ["--i" as string]: 2 }}>
        <a href="#platforms" className="ae-btn-chip">
          {t("cats.platforms")}
        </a>
        {CATEGORY_GROUPS.map((g) => (
          <a key={g.slug} href={`#${g.slug}`} className="ae-btn-chip">
            {group(g.slug)}
          </a>
        ))}
      </nav>

      <section id="platforms" aria-labelledby="platforms-title" className="mt-12 scroll-mt-24">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 id="platforms-title" className="text-base font-semibold text-fg">
            <Link href="/platforms" className="transition-colors duration-200 hover:text-accent">
              {t("cats.platforms")}
            </Link>
          </h2>
          <Link href="/platforms" className="ae-link-underline shrink-0 text-sm text-muted hover:text-fg">
            {t("cats.browseAll")}
            <span className="sr-only"> {t("cats.platforms")}</span>
          </Link>
        </div>
        <p className="mt-3 mb-5 text-sm text-muted">{t("cats.platforms.intro")}</p>
        <PlatformGrid platforms={PLATFORMS} counts={platformCounts} />
      </section>

      <section aria-label={t("cats.groups")} className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORY_GROUPS.map((g, i) => (
          <CategoryBlock
            key={g.slug}
            id={g.slug}
            index={i}
            title={group(g.slug)}
            description={groupDesc(g.slug)}
            href={libraryHref("all", { group: g.slug })}
            items={g.categories.map((c) => ({
              label: cat(c.slug),
              href: libraryHref("all", { categories: [c.slug] }),
              count: counts[c.slug] ?? 0,
            }))}
          />
        ))}
      </section>
    </div>
  );
}

function CategoryBlock({
  id,
  title,
  description,
  href,
  items,
  index,
}: {
  id: string;
  title: string;
  description?: string;
  href: string;
  items: { label: string; href: string; count: number }[];
  index: number;
}) {
  const { t } = useI18n();
  return (
    <div id={id} className="ae-reveal scroll-mt-24" style={{ ["--i" as string]: index }}>
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="text-base font-semibold text-fg">
          <Link href={href} className="transition-colors duration-200 hover:text-accent">
            {title}
          </Link>
        </h2>
        <Link href={href} className="ae-link-underline shrink-0 text-sm text-muted hover:text-fg">
          {t("cats.browseAll")}
          <span className="sr-only"> {title}</span>
        </Link>
      </div>
      {description && <p className="mt-3 text-sm text-muted">{description}</p>}
      <ul className="mt-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cx(
                "group/row -mx-2 flex items-center justify-between rounded-[0.6rem] px-2 py-1.5 text-[14px] transition-colors duration-200 hover:bg-surface-2",
                item.count === 0 ? "text-subtle" : "text-fg",
              )}
            >
              {item.label}
              <span className="text-[13px] text-subtle tabular transition-colors group-hover/row:text-accent">{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
