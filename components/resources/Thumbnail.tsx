"use client";

import Image from "next/image";
import { useState } from "react";
import { sourceLabel } from "@/lib/config/sources";
import type { Resource } from "@/lib/types";
import { useI18n } from "@/components/settings/useI18n";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

const FORMAT_ICON: Record<Resource["format"], IconName> = {
  video: "film",
  course: "layers",
  article: "book",
  dataset: "database",
  "photo-study": "image",
};

/**
 * Real source thumbnails when the source provides one (YouTube); otherwise a
 * clearly labelled placeholder — never a stock image standing in for the resource.
 * Images fade in once decoded over a shimmering frame, so nothing pops.
 */
export function Thumbnail({
  resource,
  sizes = "(min-width: 1280px) 300px, (min-width: 768px) 33vw, 90vw",
  priority = false,
  className,
  showPlay = true,
}: {
  resource: Resource;
  sizes?: string;
  priority?: boolean;
  className?: string;
  showPlay?: boolean;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const unavailable = resource.availability === "unavailable";
  const showImage = resource.thumbnail && state !== "failed" && !unavailable;

  return (
    <div
      className={cx(
        "ae-thumb relative aspect-video w-full overflow-hidden rounded-thumb bg-thumb ring-1 ring-line ring-inset",
        className,
      )}
    >
      {showImage && resource.thumbnail ? (
        <>
          {state === "loading" && <span aria-hidden="true" className="ae-skeleton absolute inset-0" />}
          <Image
            src={resource.thumbnail.url}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className={cx(
              "object-cover transition-[opacity,transform,filter] duration-700 ease-soft group-hover:scale-[1.03]",
              state === "loaded" ? "opacity-100 blur-0" : "opacity-0 blur-sm",
            )}
            onLoad={() => setState("loaded")}
            onError={() => setState("failed")}
          />
          {/* Gentle bottom shade keeps the frame edge calm on bright thumbnails. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
          {showPlay && resource.format === "video" && (
            <span aria-hidden="true" className="ae-play">
              <Icon name="play" size={18} className="translate-x-px" />
            </span>
          )}
        </>
      ) : (
        <Placeholder resource={resource} unavailable={unavailable} />
      )}
    </div>
  );
}

function Placeholder({ resource, unavailable }: { resource: Resource; unavailable: boolean }) {
  const { t } = useI18n();
  return (
    <div className="ae-placeholder absolute inset-0 flex flex-col justify-between p-3.5">
      {/* A spacing chart: the animator's notation for easing between two keys. */}
      <svg viewBox="0 0 120 24" className="h-5 w-24 self-end text-line-strong" aria-hidden="true">
        <path d="M2 12h116" stroke="currentColor" strokeWidth="1.2" />
        {[2, 30, 52, 70, 84, 95, 104, 111, 116, 118].map((x) => (
          <path key={x} d={`M${x} ${x === 2 || x === 118 ? 4 : 7}v${x === 2 || x === 118 ? 16 : 10}`} stroke="currentColor" strokeWidth="1.2" />
        ))}
      </svg>
      <div className="flex items-start gap-2 text-xs text-muted">
        <Icon name={unavailable ? "alert" : FORMAT_ICON[resource.format]} size={16} className="mt-px shrink-0 text-accent" />
        <span className="flex flex-col gap-0.5">
          <span>
            {unavailable
              ? t("thumb.unavailable")
              : t("thumb.on", { format: t(`format.${resource.format}`), source: sourceLabel(resource.source) })}
          </span>
          <span className="text-subtle">{t("thumb.noPreview")}</span>
        </span>
      </div>
    </div>
  );
}
