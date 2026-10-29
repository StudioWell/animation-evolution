"use client";

import type { ReactNode } from "react";
import { CATEGORY_GROUPS, getGroup } from "@/lib/config/categories";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Category navigation: the eight group tabs, then the selected group's
 * categories as multi-select chips. Categories combine with OR; everything else
 * combines with AND. Groups and categories with nothing in this library are hidden.
 */
export function FacetNav({
  group,
  categories,
  counts,
  groupCounts,
  onGroupChange,
  onCategoriesChange,
}: {
  group: string | null;
  categories: string[];
  counts: Record<string, number>;
  groupCounts: Record<string, number>;
  onGroupChange: (group: string | null) => void;
  onCategoriesChange: (categories: string[]) => void;
}) {
  const { t, cat, group: groupName, number } = useI18n();
  const groups = CATEGORY_GROUPS.filter((g) => (groupCounts[g.slug] ?? 0) > 0 || g.slug === group);
  const activeGroup = group ? getGroup(group) : undefined;
  // Selected categories outside the active group still need to be visible and removable.
  const stray = categories.filter((c) => !activeGroup?.categories.some((gc) => gc.slug === c));

  const toggle = (slug: string) =>
    onCategoriesChange(categories.includes(slug) ? categories.filter((c) => c !== slug) : [...categories, slug]);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={t("facet.groups")} className="scroller-x -mx-4 flex gap-1.5 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <GroupTab active={!group} onClick={() => onGroupChange(null)}>
          {t("facet.allCategories")}
        </GroupTab>
        {groups.map((g) => (
          <GroupTab key={g.slug} active={group === g.slug} onClick={() => onGroupChange(group === g.slug ? null : g.slug)}>
            {groupName(g.slug)}
            <span className="tabular opacity-60">{number(groupCounts[g.slug] ?? 0)}</span>
          </GroupTab>
        ))}
      </div>

      {activeGroup && (
        <div role="group" key={activeGroup.slug} aria-label={groupName(activeGroup.slug)} className="flex flex-wrap gap-1.5">
          {activeGroup.categories
            .filter((c) => (counts[c.slug] ?? 0) > 0 || categories.includes(c.slug))
            .map((c, index) => {
              const pressed = categories.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggle(c.slug)}
                  style={{ ["--i" as string]: Math.min(index, 12) }}
                  className={cx(
                    "ae-pop-in inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-[background-color,border-color,color] duration-200",
                    pressed ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {pressed && <Icon name="check" size={13} strokeWidth={2.4} />}
                  {cat(c.slug)}
                  <span className={cx("tabular", pressed ? "opacity-70" : "text-subtle")}>{number(counts[c.slug] ?? 0)}</span>
                </button>
              );
            })}
        </div>
      )}

      {stray.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t("facet.other")}>
          {stray.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              className="ae-pop-in inline-flex h-8 items-center gap-1.5 rounded-full border border-accent bg-accent px-3 text-[13px] text-accent-ink"
            >
              {cat(slug)}
              <Icon name="close" size={13} strokeWidth={2.2} />
              <span className="sr-only">{t("facet.remove")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap transition-[background-color,border-color,color] duration-200",
        active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
