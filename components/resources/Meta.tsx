"use client";

import { sourceLabel } from "@/lib/config/sources";
import { cx, formatDuration } from "@/lib/format";
import type { Difficulty, Resource } from "@/lib/types";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";

/**
 * Duration label shown below thumbnails. Hidden globally by the "Show Video
 * Timestamps" setting through the `.ae-duration` class. Only real metadata is
 * shown — when the source hasn't reported a length, cards show nothing rather
 * than a guess (the details page states that the length is unknown).
 */
export function Duration({ resource, className }: { resource: Resource; className?: string }) {
  const { t, spoken } = useI18n();
  const text = formatDuration(resource.durationSeconds);
  if (!text) return null;
  return (
    <span className={cx("ae-duration inline-flex items-center gap-1.5 text-fg tabular", className)}>
      <Icon name="clock" size={14} className="text-subtle" />
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{t("duration.sr", { spoken: spoken(resource.durationSeconds) ?? text })}</span>
    </span>
  );
}

export function SourceName({ resource, className }: { resource: Resource; className?: string }) {
  return <span className={cx("truncate", className)}>{sourceLabel(resource.source)}</span>;
}

const LEVELS: Record<Difficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };

/** Three ticks, like keys on a timing chart, filled up to the level. */
export function DifficultyMeter({ level }: { level: Difficulty | null | undefined }) {
  const { t } = useI18n();
  if (!level) return null;
  const filled = LEVELS[level];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx("w-[3px] rounded-full transition-[height] duration-300 ease-spring", i <= filled ? "bg-accent" : "bg-line-strong")}
            style={{ height: `${6 + i * 3}px` }}
          />
        ))}
      </span>
      {t(`level.${level}`)}
    </span>
  );
}

export function AvailabilityNote({ resource }: { resource: Resource }) {
  const { t } = useI18n();
  if (resource.availability === "unavailable") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-danger">
        <Icon name="alert" size={14} />
        {t("avail.unavailable", { source: sourceLabel(resource.source) })}
      </span>
    );
  }
  if (resource.availability === "restricted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
        <Icon name="info" size={14} />
        {t("avail.restricted", { source: sourceLabel(resource.source) })}
      </span>
    );
  }
  return null;
}

/** First tags, translated. */
export function Tags({ resource, limit = 3 }: { resource: Resource; limit?: number }) {
  const { tag } = useI18n();
  return (
    <>
      {resource.tags.slice(0, limit).map((name) => (
        <span key={name} className="ae-tag">
          {tag(name)}
        </span>
      ))}
    </>
  );
}
