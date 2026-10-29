"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCommunity } from "@/components/community/CommunityProvider";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Tells an author, on any page, that the site owner reviewed their video —
 * with the reason when it was rejected. "OK" marks it as seen for good;
 * closing hides it for this visit only. My Profile shows the same news in
 * the list, so the toast stays out of the way there.
 */
export function DecisionToast() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { unseen, markSeen } = useCommunity();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const item = unseen.find((s) => !dismissed.includes(`${s.id}@${s.reviewedAt}`));
  if (!item || pathname === "/profile") return null;
  const rejected = item.status === "rejected";
  const hide = () => setDismissed((d) => [...d, `${item.id}@${item.reviewedAt}`]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-4 sm:justify-end sm:p-6">
      <div
        className={cx(
          "ae-toast pointer-events-auto relative w-full max-w-sm rounded-[1.25rem] border bg-surface-2 p-5 pr-12 shadow-2xl",
          rejected ? "border-[color-mix(in_srgb,#e0857a_55%,transparent)]" : "border-[color-mix(in_srgb,#7fbf8a_55%,transparent)]",
        )}
      >
        <button type="button" onClick={hide} className="ae-icon-btn absolute top-3 right-3" aria-label={t("dialog.close")}>
          <Icon name="close" size={14} />
        </button>
        <p className="flex items-start gap-2.5 text-[14px] leading-snug font-medium text-fg">
          <span className={cx("mt-0.5 shrink-0", rejected ? "text-[#f0a79e]" : "text-[#a6d9ae]")}>
            <Icon name={rejected ? "alert" : "check"} size={17} />
          </span>
          {t(rejected ? "notice.rejected" : "notice.approved", { title: item.title })}
        </p>
        {rejected && item.reason && <p className="mt-2.5 pl-[1.6rem] text-[13px] leading-relaxed text-muted">{t("community.reason", { reason: item.reason })}</p>}
        <div className="mt-4 flex flex-wrap gap-2 pl-[1.6rem]">
          <button type="button" onClick={() => void markSeen(item.id)} className="ae-btn ae-btn-primary">
            {t("notice.ok")}
          </button>
          <Link href="/profile" className="ae-btn ae-btn-quiet">
            {t("notice.open")}
          </Link>
        </div>
      </div>
    </div>
  );
}
