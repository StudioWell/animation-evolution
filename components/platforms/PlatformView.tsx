"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ResultsGrid } from "@/components/library/ResultsGrid";
import { PlatformMonogram } from "@/components/platforms/PlatformCard";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { getPlatform } from "@/lib/config/platforms";
import { cx } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { libraryHref } from "@/lib/search/query-string";
import type { Difficulty, Resource } from "@/lib/types";

const LEVELS: (Difficulty | "unrated")[] = ["beginner", "intermediate", "advanced", "unrated"];

/**
 * One platform's learning page: tutorials grouped by level (start here → go
 * further), filterable by level and topic, then reels made with the tool.
 */
export function PlatformView({ slug, tutorials, references }: { slug: string; tutorials: Resource[]; references: Resource[] }) {
  const { t, cat, plural } = useI18n();
  const platform = getPlatform(slug)!;
  const [level, setLevel] = useState<Difficulty | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  // Topics that actually occur, most common first.
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of tutorials) for (const c of r.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c);
  }, [tutorials]);

  const shown = tutorials.filter((r) => (!level || r.difficulty === level) && (!topic || r.categories.includes(topic)));
  const sections = LEVELS.map((l) => ({ level: l, items: shown.filter((r) => (r.difficulty ?? "unrated") === l) })).filter((s) => s.items.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <Link href="/platforms" className="ae-link-underline inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <Icon name="chevronLeft" size={15} />
        {t("platform.back")}
      </Link>

      <header className="ae-band mt-5 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <PlatformMonogram platform={platform} size={76} />
        <div className="min-w-0 flex-1">
          <h1 className="stretch-wide text-[clamp(2rem,4.4vw,3rem)] leading-[1.02] font-bold tracking-[-0.03em] text-fg">{platform.name}</h1>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">{t(`platform.${slug}.desc` as MessageKey)}</p>
          <p className="mt-2 text-sm text-accent tabular">{plural("platforms.tutorials", tutorials.length)}</p>
        </div>
        <Link href={libraryHref("tutorial", { software: [platform.software] })} className="ae-btn ae-btn-ghost shrink-0">
          <Icon name="book" size={16} />
          {t("platform.library")}
        </Link>
      </header>

      <div className="mt-8 flex flex-col gap-3">
        <ChipRow label={t("platform.level")}>
          <Chip active={!level} onClick={() => setLevel(null)}>
            {t("platform.level.all")}
          </Chip>
          {(["beginner", "intermediate", "advanced"] as const).filter((l) => tutorials.some((r) => r.difficulty === l)).map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(level === l ? null : l)}>
              {t(`level.${l}`)}
            </Chip>
          ))}
        </ChipRow>
        {topics.length > 1 && (
          <ChipRow label={t("platform.topic")}>
            <Chip active={!topic} onClick={() => setTopic(null)}>
              {t("platform.topic.all")}
            </Chip>
            {topics.map((c) => (
              <Chip key={c} active={topic === c} onClick={() => setTopic(topic === c ? null : c)}>
                {cat(c)}
              </Chip>
            ))}
          </ChipRow>
        )}
        {(level || topic) && (
          <p className="text-sm text-subtle tabular" aria-live="polite">
            {t("platform.showing", { shown: shown.length, total: tutorials.length })}
          </p>
        )}
      </div>

      {sections.length === 0 ? (
        <p className="mt-10 rounded-control border border-line bg-surface px-5 py-4 text-sm text-muted">{t("platform.empty")}</p>
      ) : (
        sections.map((s) => (
          <section key={s.level} aria-labelledby={`lvl-${s.level}`} className="mt-10">
            <h2 id={`lvl-${s.level}`} className="stretch-semi mb-4 flex items-baseline gap-3 text-xl font-semibold tracking-[-0.02em] text-fg">
              {t(`platform.section.${s.level}` as MessageKey)}
              <span className="text-sm font-normal text-subtle tabular">{s.items.length}</span>
            </h2>
            <ResultsGrid items={s.items} />
          </section>
        ))
      )}

      {references.length > 0 && !level && !topic && (
        <section aria-labelledby="made-with" className="mt-14">
          <h2 id="made-with" className="stretch-semi mb-4 text-xl font-semibold tracking-[-0.02em] text-fg">
            {t("platform.references", { name: platform.name })}
          </h2>
          <ResultsGrid items={references} />
        </section>
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-full text-[12px] tracking-[0.08em] text-subtle uppercase sm:w-auto">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-8 items-center rounded-full border px-3 text-[13px] transition-[background-color,border-color,color] duration-200",
        active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
