"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useCommunity, type SubmitError } from "@/components/community/CommunityProvider";
import { StatusBadge, SubmissionMeta, SubmissionVideo } from "@/components/community/parts";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { GENRES, LIMITS, PLATFORM_CHOICES, VIDEO_TYPES, type GenreSlug, type PlatformChoice } from "@/lib/community/model";
import { getPlatform } from "@/lib/config/platforms";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

const field =
  "w-full rounded-control border border-line-strong bg-surface px-4 text-[15px] text-fg placeholder:text-subtle focus:border-accent focus:outline-none";
const label = "text-sm font-medium text-fg";

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "Publish a video" — the form in My Profile. */
export function SubmitVideoForm() {
  const { t } = useI18n();
  const { status, canSubmit, canUpload, submit } = useCommunity();
  const [source, setSource] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"reference" | "tutorial">("tutorial");
  const [platform, setPlatform] = useState<PlatformChoice>("blender");
  const [genres, setGenres] = useState<GenreSlug[]>([]);
  const [stage, setStage] = useState<"idle" | "uploading" | "saving">("idle");
  const [error, setError] = useState<SubmitError | null>(null);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ids = { title: useId(), description: useId(), link: useId(), platform: useId(), error: useId() };
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!canUpload) setSource("link");
  }, [canUpload]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (status === "loading") return null;
  const blocked = status === "unavailable" ? "submit.unavailable" : !canSubmit ? "submit.needsAccount" : null;

  const pick = (f: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    setSent(false);
    if (!VIDEO_TYPES.includes(f.type as (typeof VIDEO_TYPES)[number])) return setError("file-type");
    if (f.size > LIMITS.uploadBytes) return setError("file-size");
    setError(null);
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").slice(0, LIMITS.title));
  };

  const toggleGenre = (g: GenreSlug) => {
    setGenres((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : cur.length >= LIMITS.genres ? cur : [...cur, g]));
    if (error === "invalid") setError(null);
  };

  const onSubmit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (stage !== "idle") return;
    setSent(false);
    const hasVideo = source === "upload" ? Boolean(file) : Boolean(link.trim());
    if (!title.trim() || !hasVideo || genres.length === 0) return setError("invalid");
    setError(null);
    const result = await submit(
      { title, description, kind, platform, genres, file: source === "upload" ? file : null, link: source === "link" ? link : "" },
      setStage,
    );
    setStage("idle");
    if (result) return setError(result);
    setFile(null);
    setLink("");
    setTitle("");
    setDescription("");
    setGenres([]);
    setSent(true);
  };

  const busy = stage !== "idle";
  return (
    <section aria-labelledby="publish-title" className="ae-band mt-10 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <Icon name="upload" size={20} />
        </span>
        <div>
          <h2 id="publish-title" className="stretch-semi text-xl font-semibold tracking-[-0.02em] text-fg">
            {t("submit.title")}
          </h2>
          <p className="mt-1 max-w-[60ch] text-[14px] leading-relaxed text-muted">{t("submit.lead")}</p>
        </div>
      </div>

      {blocked ? (
        <p className="mt-6 flex items-start gap-2 rounded-control border border-line bg-surface px-4 py-3 text-[13.5px] leading-relaxed text-muted">
          <Icon name="info" size={15} className="mt-0.5 shrink-0" />
          {t(blocked)}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          {/* Left: the video */}
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className={cx(label, "mb-3")}>{t("submit.video")}</legend>
            <div role="radiogroup" aria-label={t("submit.video")} className="inline-flex w-fit rounded-full border border-line bg-surface p-1">
              {(["upload", "link"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={source === s}
                  disabled={s === "upload" && !canUpload}
                  onClick={() => {
                    setSource(s);
                    setError(null);
                  }}
                  className={cx(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                    source === s ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon name={s === "upload" ? "upload" : "link"} size={14} />
                  {t(s === "upload" ? "submit.upload" : "submit.link")}
                </button>
              ))}
            </div>
            {!canUpload && <p className="text-[12.5px] text-subtle">{t("submit.noUpload")}</p>}

            {source === "upload" ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept={VIDEO_TYPES.join(",")}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
                {file && preview ? (
                  <div className="flex flex-col gap-2.5">
                    <video src={preview} controls muted playsInline preload="metadata" className="aspect-video w-full rounded-[1rem] bg-black object-contain" />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
                      <span className="min-w-0 truncate">
                        {file.name} · {formatSize(file.size)}
                      </span>
                      <button type="button" onClick={() => fileRef.current?.click()} className="ae-btn ae-btn-quiet">
                        {t("submit.file.change")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e: { preventDefault(): void }) => e.preventDefault()}
                    onDrop={(e: { preventDefault(): void; dataTransfer: DataTransfer | null }) => {
                      e.preventDefault();
                      pick(e.dataTransfer?.files?.[0]);
                    }}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[1rem] border border-dashed border-line-strong bg-surface text-muted transition-colors hover:border-accent hover:text-fg"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong">
                      <Icon name="film" size={20} />
                    </span>
                    <span className="text-[14.5px] font-medium text-fg">{t("submit.file.choose")}</span>
                    <span className="text-[12.5px] text-subtle">{t("submit.file.hint")}</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor={ids.link} className="sr-only">
                  {t("submit.link")}
                </label>
                <input
                  id={ids.link}
                  type="url"
                  inputMode="url"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    if (error === "invalid") setError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className={cx(field, "h-12")}
                />
                <p className="text-[12.5px] text-subtle">{t("submit.link.hint")}</p>
              </div>
            )}
          </fieldset>

          {/* Right: details */}
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.title} className={label}>
                {t("submit.name")}
              </label>
              <input
                id={ids.title}
                value={title}
                maxLength={LIMITS.title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error === "invalid") setError(null);
                }}
                placeholder={t("submit.name.placeholder")}
                className={cx(field, "h-12")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.description} className={label}>
                {t("submit.description")}
              </label>
              <textarea
                id={ids.description}
                value={description}
                maxLength={LIMITS.description}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("submit.description.placeholder")}
                className={cx(field, "resize-y py-3 leading-relaxed")}
              />
            </div>

            <fieldset className="flex flex-col gap-2.5">
              <legend className={cx(label, "mb-2.5")}>{t("submit.kind")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["reference", "tutorial"] as const).map((k) => (
                  <label
                    key={k}
                    className={cx(
                      "flex cursor-pointer items-center gap-2.5 rounded-control border px-4 py-3 text-[14px] transition-colors",
                      kind === k ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-[var(--ae-accent)]" />
                    <Icon name={k === "tutorial" ? "book" : "film"} size={16} />
                    {t(k === "tutorial" ? "detail.kind.tutorial" : "detail.kind.reference")}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor={ids.platform} className={label}>
                {t("submit.platform")}
              </label>
              <select
                id={ids.platform}
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformChoice)}
                className={cx(field, "h-12 appearance-auto")}
              >
                {PLATFORM_CHOICES.map((p) => (
                  <option key={p} value={p}>
                    {getPlatform(p)?.name ?? t("community.platform.other")}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className={cx(label, "mb-1")}>{t("submit.genre")}</legend>
              <p className="text-[12.5px] text-subtle">{t("submit.genre.hint")}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {GENRES.map(({ slug }) => {
                  const on = genres.includes(slug);
                  const full = !on && genres.length >= LIMITS.genres;
                  return (
                    <button
                      key={slug}
                      type="button"
                      aria-pressed={on}
                      disabled={full}
                      onClick={() => toggleGenre(slug)}
                      className={cx(
                        "ae-btn-chip disabled:opacity-40",
                        on && "border-accent bg-accent-soft text-fg hover:bg-accent-soft",
                      )}
                    >
                      {on && <Icon name="check" size={13} />}
                      {t(`genre.${slug}` as MessageKey)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-6 lg:col-span-2">
            {error && (
              <p id={ids.error} role="alert" className="flex items-start gap-2 text-[13.5px] text-[#f0a79e]">
                <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                {t(`submit.err.${error}` as MessageKey)}
              </p>
            )}
            {sent && (
              <p role="status" className="flex items-start gap-2 text-[13.5px] text-[#a6d9ae]">
                <Icon name="check" size={15} className="mt-0.5 shrink-0" />
                {t("submit.sent")}
              </p>
            )}
            <button type="submit" disabled={busy} aria-describedby={error ? ids.error : undefined} className="ae-btn ae-btn-primary ae-btn-lg w-full sm:w-fit">
              {busy ? <span className="ae-spinner" aria-hidden="true" /> : <Icon name="upload" size={17} />}
              {stage === "uploading" ? t("submit.uploading") : stage === "saving" ? t("submit.saving") : t("submit.send")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/** The author's own submissions with their review status. */
export function MySubmissions() {
  const { t, date } = useI18n();
  const { status, canSubmit, mine, withdraw, markSeen } = useCommunity();
  const [confirming, setConfirming] = useState<string | null>(null);
  if (status !== "ready" || !canSubmit) return null;

  return (
    <section aria-labelledby="mine-title" className="mt-10">
      <h2 id="mine-title" className="stretch-semi mb-5 text-xl font-semibold tracking-[-0.02em] text-fg">
        {t("mine.title")}
      </h2>
      {mine.length === 0 ? (
        <p className="rounded-control border border-dashed border-line-strong px-5 py-6 text-center text-[14px] text-muted">{t("mine.empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((item) => {
            const unseen = item.status !== "pending" && item.reviewedAt && (!item.seenAt || item.seenAt < item.reviewedAt);
            return (
              <li
                key={item.id}
                className={cx("flex flex-col gap-3 rounded-[1.25rem] border bg-surface p-3.5", unseen ? "border-accent" : "border-line")}
              >
                <SubmissionVideo item={item} />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.status !== "approved" && <span className="text-[12px] text-subtle">{t("community.onlyYou")}</span>}
                </div>
                <h3 className="text-[15px] leading-snug font-semibold text-fg">{item.title}</h3>
                <SubmissionMeta item={item} />
                {item.status === "rejected" && item.reason && (
                  <p className="rounded-control border border-[color-mix(in_srgb,#e0857a_35%,transparent)] bg-[color-mix(in_srgb,#e0857a_8%,transparent)] px-3 py-2 text-[13px] leading-relaxed text-fg">
                    {t("community.reason", { reason: item.reason })}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1 text-[12px] text-subtle">
                  <span>{t("mine.sent", { date: date(item.createdAt) ?? "" })}</span>
                  <div className="flex gap-2">
                    {unseen && (
                      <button type="button" onClick={() => void markSeen(item.id)} className="ae-btn ae-btn-ghost">
                        <Icon name="check" size={14} />
                        {t("notice.ok")}
                      </button>
                    )}
                    {item.status === "approved" ? null : confirming === item.id ? (
                      <>
                        <button type="button" onClick={() => void withdraw(item.id)} className="ae-btn ae-btn-ghost text-[#f0a79e]">
                          <Icon name="trash" size={14} />
                          {t("mine.delete")}
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className="ae-btn ae-btn-quiet">
                          {t("review.cancel")}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirming(item.id)} className="ae-btn ae-btn-quiet" aria-label={`${t("mine.delete")}: ${item.title}`}>
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
