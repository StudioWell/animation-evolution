"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommunity } from "@/components/community/CommunityProvider";
import { StatusBadge, SubmissionMeta, SubmissionVideo, platformLabel } from "@/components/community/parts";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { GENRES, PLATFORM_CHOICES, type Submission } from "@/lib/community/model";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

type KindFilter = "all" | "reference" | "tutorial";

/** /community — approved videos, plus the viewer's own ones still under review. */
export function CommunityView() {
  const { t } = useI18n();
  const { status, published, mine } = useCommunity();
  const [kind, setKind] = useState<KindFilter>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [genre, setGenre] = useState<string>("all");

  const own = mine.filter((s) => s.status !== "approved");
  const items = [...own, ...published].filter(
    (s) => (kind === "all" || s.kind === kind) && (platform === "all" || s.platform === platform) && (genre === "all" || s.genres.includes(genre as Submission["genres"][number])),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:px-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="stretch-wide text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.02] font-bold tracking-[-0.03em] text-fg">{t("community.title")}</h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted">{t("community.intro")}</p>
        </div>
        <Link href="/profile" className="ae-btn ae-btn-primary ae-btn-lg w-fit shrink-0">
          <Icon name="upload" size={17} />
          {t("community.publishCta")}
        </Link>
      </header>

      {status === "loading" ? (
        <p role="status" className="mt-10 flex items-center gap-2 text-sm text-muted">
          <span className="ae-spinner" aria-hidden="true" />
        </p>
      ) : status === "unavailable" ? (
        <p className="mt-10 flex items-start gap-2 rounded-control border border-line bg-surface px-5 py-4 text-[14px] leading-relaxed text-muted">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          {t("community.unavailable")}
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 border-y border-line py-4">
            <FilterRow
              label={t("submit.kind")}
              value={kind}
              onChange={(v) => setKind(v as KindFilter)}
              options={[
                ["all", t("community.all")],
                ["reference", t("detail.kind.reference")],
                ["tutorial", t("detail.kind.tutorial")],
              ]}
            />
            <FilterRow
              label={t("submit.platform")}
              value={platform}
              onChange={setPlatform}
              options={[["all", t("community.all")], ...PLATFORM_CHOICES.map((p) => [p, platformLabel(p, t("community.platform.other"))] as [string, string])]}
            />
            <FilterRow
              label={t("submit.genre")}
              value={genre}
              onChange={setGenre}
              options={[["all", t("community.all")], ...GENRES.map((g) => [g.slug, t(`genre.${g.slug}` as MessageKey)] as [string, string])]}
            />
          </div>

          {items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-line-strong px-6 py-14 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong">
                <Icon name="users" size={20} />
              </span>
              <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted">{t("community.empty")}</p>
            </div>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className={cx("flex flex-col gap-3 rounded-[1.25rem] border bg-surface p-3.5", item.status === "approved" ? "border-line" : "border-dashed border-line-strong")}>
                  <SubmissionVideo item={item} />
                  {item.status !== "approved" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-[12px] text-subtle">{t("community.onlyYou")}</span>
                    </div>
                  )}
                  <h2 className="text-[15.5px] leading-snug font-semibold text-fg">{item.title}</h2>
                  <p className="-mt-1.5 text-[12.5px] text-subtle">{t("community.by", { name: item.authorName })}</p>
                  {item.description && <p className="line-clamp-3 text-[13.5px] leading-relaxed text-muted">{item.description}</p>}
                  <div className="mt-auto pt-1">
                    <SubmissionMeta item={item} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline" role="group" aria-label={label}>
      <span className="w-24 shrink-0 text-[12.5px] text-subtle">{label}</span>
      <div className="flex flex-wrap gap-2">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cx("ae-btn-chip px-3 py-1 text-[13px]", value === v && "border-accent bg-accent-soft text-fg")}
        >
          {text}
        </button>
      ))}
      </div>
    </div>
  );
}
