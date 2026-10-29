"use client";

import Link from "next/link";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_GROUPS } from "@/lib/config/categories";
import { libraryHref } from "@/lib/search/query-string";
import type { Resource } from "@/lib/types";

/**
 * The seven category groups, ordered by how many videos they hold, with their
 * busiest categories as direct links into the whole library.
 */
export function CategoryGrid({ references }: { references: Resource[] }) {
  const { t, group: groupName, groupDesc, cat, plural } = useI18n();
  const counts = new Map<string, number>();
  for (const r of references) for (const c of r.categories) counts.set(c, (counts.get(c) ?? 0) + 1);

  const groups = CATEGORY_GROUPS.map((group) => {
    const total = references.filter((r) => r.categories.some((c) => group.categories.some((gc) => gc.slug === c))).length;
    const top = [...group.categories]
      .map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { group, total, top };
  }).sort((a, b) => b.total - a.total);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map(({ group, total, top }, index) => {
        const name = groupName(group.slug);
        return (
          <li
            key={group.slug}
            style={{ ["--i" as string]: index }}
            className="ae-card-in ae-card group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface p-5"
          >
            <div className="relative flex items-baseline justify-between gap-4">
              <h3 className="text-base font-semibold text-fg">
                <Link
                  href={libraryHref("all", { group: group.slug })}
                  className="outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-accent-strong"
                >
                  {name}
                </Link>
              </h3>
              <span className="shrink-0 text-sm text-subtle tabular">{plural("count.inLibrary", total)}</span>
            </div>
            <p className="relative mt-1.5 text-sm leading-relaxed text-muted">{groupDesc(group.slug)}</p>
            <ul className="relative z-10 mt-4 flex flex-wrap gap-1.5" aria-label={t("grid.categoriesOf", { group: name })}>
              {top.map((c) => (
                <li key={c.slug}>
                  <Link href={libraryHref("all", { categories: [c.slug] })} className="ae-tag-link">
                    {cat(c.slug)}
                    {c.count > 0 && <span className="text-subtle tabular">{c.count}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <Icon
              name="chevronRight"
              size={18}
              className="absolute right-4 bottom-4 text-subtle opacity-0 transition-[opacity,transform] duration-300 ease-spring group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </li>
        );
      })}
    </ul>
  );
}
