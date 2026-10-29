"use client";

import { useCallback, useId, useState } from "react";
import { useCommunity } from "@/components/community/CommunityProvider";
import { SubmissionMeta, SubmissionVideo } from "@/components/community/parts";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { LIMITS, type Submission, type SubmissionStatus } from "@/lib/community/model";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

/** Header button that only the site owner sees: opens the review queue. */
export function ReviewButton() {
  const { t } = useI18n();
  const { isOwner, all } = useCommunity();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (!isOwner) return null;
  const waiting = all.filter((s) => s.status === "pending").length;
  const label = waiting ? `${t("review.button")} (${waiting})` : t("review.button");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        className={cx(
          "relative mr-2 grid size-10 place-items-center rounded-full border transition-[border-color,color,transform] duration-200 hover:-translate-y-px",
          waiting ? "border-accent text-accent-strong" : "border-line text-muted hover:border-line-strong hover:text-fg",
        )}
      >
        <Icon name="shield" size={18} />
        {waiting > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-ink tabular">
            {waiting > 99 ? "99+" : waiting}
          </span>
        )}
      </button>
      <ReviewDialog open={open} onClose={close} />
    </>
  );
}

const TABS: SubmissionStatus[] = ["pending", "approved", "rejected"];

function ReviewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { all } = useCommunity();
  const [tab, setTab] = useState<SubmissionStatus>("pending");
  const shown = all.filter((s) => s.status === tab);
  // Oldest first in the queue, so people are reviewed in the order they sent.
  if (tab === "pending") shown.reverse();

  return (
    <Modal open={open} onClose={onClose} title={t("review.title")} className="max-h-[92vh]! max-w-4xl!">
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{t("review.lead")}</p>
      <div role="tablist" aria-label={t("review.title")} className="mt-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {TABS.map((s) => {
          const count = all.filter((x) => x.status === s).length;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={cx("ae-btn-chip", tab === s && "border-accent bg-accent-soft text-fg")}
            >
              {t(`review.tab.${s}` as MessageKey)}
              <span className="ml-1 text-subtle tabular">{count}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-5">
        {shown.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-subtle">{t("review.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {shown.map((item) => (
              <ReviewItem key={`${item.authorId}/${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function ReviewItem({ item }: { item: Submission }) {
  const { t, date } = useI18n();
  const { approve, reject } = useCommunity();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const reasonId = useId();

  const run = async (task: () => Promise<boolean>) => {
    setBusy(true);
    setFailed(false);
    const ok = await task();
    setBusy(false);
    if (!ok) setFailed(true);
    else setRejecting(false);
  };

  return (
    <li className="grid gap-4 rounded-[1.25rem] border border-line bg-surface-2 p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <SubmissionVideo item={item} />
      <div className="flex min-w-0 flex-col gap-2.5">
        <h3 className="text-[16px] leading-snug font-semibold text-fg">{item.title}</h3>
        <p className="text-[12.5px] text-subtle">{t("review.from", { name: item.authorName, date: date(item.createdAt) ?? "" })}</p>
        <SubmissionMeta item={item} />
        {item.description && <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-muted">{item.description}</p>}
        {item.status === "rejected" && item.reason && <p className="text-[13px] text-[#f0a79e]">{t("community.reason", { reason: item.reason })}</p>}

        {rejecting ? (
          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor={reasonId} className="text-[13px] font-medium text-fg">
              {t("review.reason")}
            </label>
            <textarea
              id={reasonId}
              data-autofocus
              value={reason}
              maxLength={LIMITS.reason}
              rows={3}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("review.reason.placeholder")}
              className="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2.5 text-[14px] leading-relaxed text-fg placeholder:text-subtle focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !reason.trim()}
                onClick={() => void run(() => reject(item, reason))}
                className="ae-btn ae-btn-ghost border-[color-mix(in_srgb,#e0857a_55%,transparent)] text-[#f0a79e]"
              >
                {busy ? <span className="ae-spinner" aria-hidden="true" /> : <Icon name="close" size={14} />}
                {t("review.confirmReject")}
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="ae-btn ae-btn-quiet">
                {t("review.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {item.status !== "approved" && (
              <button type="button" disabled={busy} onClick={() => void run(() => approve(item))} className="ae-btn ae-btn-primary">
                {busy ? <span className="ae-spinner" aria-hidden="true" /> : <Icon name="check" size={15} />}
                {t("review.approve")}
              </button>
            )}
            {item.status !== "rejected" && (
              <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="ae-btn ae-btn-ghost">
                <Icon name={item.status === "approved" ? "trash" : "close"} size={14} />
                {t(item.status === "approved" ? "review.remove" : "review.reject")}
              </button>
            )}
          </div>
        )}
        {failed && (
          <p role="alert" className="text-[13px] text-[#f0a79e]">
            {t("review.failed")}
          </p>
        )}
      </div>
    </li>
  );
}
