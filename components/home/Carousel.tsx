"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Horizontally scrollable row with scroll-snap. Previous/next buttons appear on
 * pointer devices and are disabled at the ends; touch users swipe.
 */
export function Carousel({ children, label, itemClassName }: { children: ReactNode; label: string; itemClassName?: string }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // ResizeObserver reports once on observe, which sets the initial edge state.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce =
      document.documentElement.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="group/carousel relative">
      <ul
        ref={scroller}
        onScroll={update}
        aria-label={label}
        className="scroller-x -mx-4 flex scroll-px-4 gap-5 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {Children.map(children, (child, index) => (
          <li
            style={{ ["--i" as string]: Math.min(index, 8) }}
            className={cx(
              "ae-card-in",
              // Phones: one card plus a peek. Tablets: two and a peek. Desktop: exactly four.
              "w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2.2)] sm:max-w-none lg:w-[calc((100%-3.75rem)/4)]",
              itemClassName,
            )}
          >
            {child}
          </li>
        ))}
      </ul>
      {/* Arrows sit on the thumbnail midline (290px cards → 163px thumbnails). */}
      <ArrowButton direction={-1} hidden={edges.start} label={label} onClick={() => page(-1)} />
      <ArrowButton direction={1} hidden={edges.end} label={label} onClick={() => page(1)} />
    </div>
  );
}

function ArrowButton({ direction, hidden, label, onClick }: { direction: 1 | -1; hidden: boolean; label: string; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      className={cx(
        "absolute top-[62px] z-10 hidden size-10 place-items-center rounded-full border border-line-strong bg-surface-2 text-fg shadow-panel lg:grid",
        "transition-[opacity,transform,background-color] duration-300 ease-spring hover:scale-110 hover:bg-surface-3 active:scale-95",
        direction === -1 ? "-left-5" : "-right-5",
        hidden
          ? "pointer-events-none opacity-0"
          : "opacity-0 group-hover/carousel:opacity-100 group-focus-within/carousel:opacity-100 focus-visible:opacity-100",
      )}
    >
      <Icon name={direction === -1 ? "chevronLeft" : "chevronRight"} size={18} />
      <span className="sr-only">{t(direction === -1 ? "carousel.back" : "carousel.forward", { label })}</span>
    </button>
  );
}
