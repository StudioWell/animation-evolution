"use client";

import Link from "next/link";
import type { ContentType, Resource } from "@/lib/types";
import { resourcePath } from "@/lib/search/query-string";
import { ExternalLink, externalHost } from "@/components/resources/ExternalLink";
import { AvailabilityNote, DifficultyMeter, Tags } from "@/components/resources/Meta";
import { Thumbnail } from "@/components/resources/Thumbnail";
import { SaveButton } from "@/components/profile/SaveButton";
import { useI18n } from "@/components/settings/useI18n";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cx, formatDuration } from "@/lib/format";

export const CONTENT_TYPE_ICON: Record<ContentType, IconName> = {
  reference: "film",
  tutorial: "book",
  breakdown: "scan",
  mocap: "figure",
};

/**
 * One card for every video in the library: thumbnail with content type and
 * length, title, creator, the work it shows, and its first tags. The card opens
 * the details page; the small arrow opens the original on its platform.
 */
export function VideoCard({ resource, priority = false, className }: { resource: Resource; priority?: boolean; className?: string }) {
  const { t, cat, spoken } = useI18n();
  const duration = formatDuration(resource.durationSeconds);
  const unavailable = resource.availability === "unavailable";
  const primary = resource.categories[0];
  const work = resource.works?.[0];

  return (
    <article
      className={cx(
        "ae-card group relative flex min-w-0 flex-col rounded-card border border-line bg-surface p-2",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent-strong",
        className,
      )}
    >
      <div className="relative">
        <Thumbnail resource={resource} priority={priority} className="ae-lift-thumb" />
        <span className="ae-badge absolute top-2 left-2">
          <Icon name={CONTENT_TYPE_ICON[resource.contentType]} size={13} />
          {t(`ctype1.${resource.contentType}`)}
        </span>
        {duration && (
          <span className="ae-duration ae-badge absolute right-2 bottom-2 tabular">
            <span aria-hidden="true">{duration}</span>
            <span className="sr-only">{t("duration.sr", { spoken: spoken(resource.durationSeconds) ?? duration })}</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
        <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="user" size={14} className="shrink-0 text-subtle" />
          <span className="truncate">{resource.creator ?? t("fact.channelUnconfirmed")}</span>
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug font-semibold text-fg">
          <Link href={resourcePath(resource)} className="ae-title-link outline-none after:absolute after:inset-0 after:rounded-card">
            {resource.title}
          </Link>
        </h3>
        <p className="mt-1.5 truncate text-[12.5px]">
          {primary && <span className="text-accent">{cat(primary)}</span>}
          {work && (
            <span className="text-subtle">
              {primary ? " · " : ""}
              {work}
            </span>
          )}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <AvailabilityNote resource={resource} />
          <Tags resource={resource} limit={3} />
        </div>
        <div className="mt-auto flex min-h-9 items-center justify-between gap-2 pt-3">
          <DifficultyMeter level={resource.difficulty} />
          <div className="relative z-10 ml-auto flex items-center gap-1.5">
            <SaveButton resource={resource} />
            {!unavailable && (
              <ExternalLink
                resource={resource}
                ariaLabel={t("card.openOriginal", { title: resource.title, host: externalHost(resource) })}
                className="ae-icon-btn"
              >
                <Icon name="external" size={15} />
              </ExternalLink>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col rounded-card border border-line bg-surface p-2">
      <div className="ae-skeleton aspect-video w-full rounded-thumb" />
      <div className="px-1.5 pt-3">
        <div className="ae-skeleton h-3 w-1/3 rounded-full" />
        <div className="ae-skeleton mt-3 h-4 w-11/12 rounded-full" />
        <div className="ae-skeleton mt-2 h-4 w-2/3 rounded-full" />
        <div className="ae-skeleton mt-3.5 h-3 w-1/2 rounded-full" />
        <div className="mt-3 flex gap-1.5">
          <div className="ae-skeleton h-5 w-14 rounded-full" />
          <div className="ae-skeleton h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
