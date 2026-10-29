"use client";

import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { assetUrl, type Submission, type SubmissionStatus } from "@/lib/community/model";
import { getPlatform } from "@/lib/config/platforms";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

export function platformLabel(slug: string, other: string): string {
  return getPlatform(slug)?.name ?? other;
}

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: "border-line-strong text-muted",
  approved: "border-[color-mix(in_srgb,#7fbf8a_55%,transparent)] text-[#a6d9ae]",
  rejected: "border-[color-mix(in_srgb,#e0857a_55%,transparent)] text-[#f0a79e]",
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { t } = useI18n();
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium", STATUS_STYLE[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t(`community.status.${status}` as MessageKey)}
    </span>
  );
}

/** The video itself: an uploaded file plays inline; a link opens on its own site. */
export function SubmissionVideo({ item, className }: { item: Submission; className?: string }) {
  const { t } = useI18n();
  if (item.video.type === "upload") {
    return (
      <video
        controls
        preload="metadata"
        playsInline
        src={assetUrl(item.video)}
        className={cx("aspect-video w-full rounded-[1rem] bg-black object-contain", className)}
      >
        {t("community.videoUnavailable")}
      </video>
    );
  }
  let host = "";
  try {
    host = new URL(item.video.url).hostname.replace(/^www\./, "");
  } catch {
    /* parseVideoLink already checked it */
  }
  return (
    <a
      href={item.video.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "group/vid relative grid aspect-video w-full place-items-center overflow-hidden rounded-[1rem] border border-line bg-[radial-gradient(120%_90%_at_30%_20%,var(--ae-surface-3),var(--ae-surface)_70%)] text-fg",
        className,
      )}
    >
      <span className="flex flex-col items-center gap-3">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-lg transition-transform duration-300 ease-spring group-hover/vid:scale-110">
          <Icon name="play" size={22} />
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-muted group-hover/vid:text-fg">
          {t("community.openLink", { host })}
          <Icon name="external" size={13} />
        </span>
      </span>
    </a>
  );
}

/** Kind · platform · genres as quiet tags. */
export function SubmissionMeta({ item }: { item: Submission }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="ae-tag">{t(item.kind === "tutorial" ? "detail.kind.tutorial" : "detail.kind.reference")}</span>
      <span className="ae-tag">{platformLabel(item.platform, t("community.platform.other"))}</span>
      {item.genres.map((g) => (
        <span key={g} className="ae-tag">
          {t(`genre.${g}` as MessageKey)}
        </span>
      ))}
    </div>
  );
}
