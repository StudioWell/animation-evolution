"use client";

import { useI18n } from "@/components/settings/useI18n";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import type { MessageKey } from "@/lib/i18n";

const POINTS: { icon: IconName; title: MessageKey; body: MessageKey }[] = [
  { icon: "search", title: "about.dialog.p1.title", body: "about.dialog.p1" },
  { icon: "book", title: "about.dialog.p2.title", body: "about.dialog.p2" },
  { icon: "film", title: "about.dialog.p3.title", body: "about.dialog.p3" },
  { icon: "bookmark", title: "about.dialog.p4.title", body: "about.dialog.p4" },
];

/** "What is this website for?" — a short explanation over a blurred page. */
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("about.dialog.title")}
      footer={
        <div className="mt-6 flex justify-end">
          <button type="button" data-autofocus onClick={onClose} className="ae-btn ae-btn-primary">
            {t("about.dialog.close")}
          </button>
        </div>
      }
    >
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{t("about.dialog.lead")}</p>
      <ul className="mt-5 flex flex-col gap-3.5">
        {POINTS.map((point, i) => (
          <li key={point.title} className="ae-pop-in flex gap-3.5" style={{ ["--i" as string]: i + 1 }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
              <Icon name={point.icon} size={17} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-fg">{t(point.title)}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{t(point.body)}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-start gap-2 rounded-control bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-muted">
        <Icon name="external" size={15} className="mt-0.5 shrink-0 text-accent" />
        {t("about.dialog.note")}
      </p>
    </Modal>
  );
}
