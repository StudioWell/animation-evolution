"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

const noopSubscribe = () => () => {};
const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex='-1'])";

/** Keep Tab inside `container`; Escape calls onEscape. Returns a cleanup. */
export function trapFocus(container: HTMLElement, onEscape: () => void): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) return event.preventDefault();
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  // Capture phase, so the top-most dialog handles keys before anything beneath it.
  document.addEventListener("keydown", onKey, true);
  return () => document.removeEventListener("keydown", onKey, true);
}

/**
 * A small centred dialog. Everything behind it is blurred and dimmed; focus is
 * trapped inside, Escape or the backdrop closes it, and focus returns to
 * whatever opened it.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  // Keep the dialog mounted briefly after closing so it can animate out.
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);
  if (open && !shown) {
    setShown(true);
    setClosing(false);
  }
  if (!open && shown && !closing) setClosing(true);

  useEffect(() => {
    if (!closing) return;
    const reduced = document.documentElement.dataset.motion === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => {
      setShown(false);
      setClosing(false);
    }, reduced ? 0 : 220);
    return () => clearTimeout(id);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const opener = document.activeElement as HTMLElement | null;
    (panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel).focus();
    const release = trapFocus(panel, onClose);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      release();
      document.body.style.overflow = overflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted || !shown) return null;
  return createPortal(
    <div className={cx("ae-modal fixed inset-0 z-[80] grid place-items-center p-4", closing && "is-closing")}>
      <div aria-hidden="true" className="ae-modal__backdrop absolute inset-0 bg-black/45 backdrop-blur-md" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "ae-modal__panel relative max-h-[min(88vh,44rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-line-strong bg-surface p-6 shadow-2xl outline-none sm:p-8",
          className,
        )}
      >
        <button type="button" onClick={onClose} className="ae-icon-btn absolute top-4 right-4" aria-label={t("dialog.close")}>
          <Icon name="close" size={16} />
        </button>
        <h2 id={titleId} className="stretch-semi pr-10 text-2xl font-semibold tracking-[-0.02em] text-fg">
          {title}
        </h2>
        {children}
        {footer}
      </div>
    </div>,
    document.body,
  );
}
