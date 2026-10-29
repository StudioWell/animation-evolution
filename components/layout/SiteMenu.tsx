"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/settings/useI18n";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

const ITEMS: { href: string; key: MessageKey; icon: IconName }[] = [
  { href: "/", key: "nav.home", icon: "home" },
  { href: "/library", key: "nav.library", icon: "search" },
  { href: "/references", key: "nav.references", icon: "film" },
  { href: "/tutorials", key: "nav.tutorials", icon: "book" },
  { href: "/categories", key: "nav.categories", icon: "grid" },
  { href: "/platforms", key: "nav.platforms", icon: "layers" },
  { href: "/community", key: "nav.community", icon: "users" },
  { href: "/profile", key: "nav.profile", icon: "user" },
  { href: "/settings", key: "nav.settings", icon: "settings" },
  { href: "/about", key: "nav.about", icon: "info" },
];

const noopSubscribe = () => () => {};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Upper-right site menu: a floating dropdown on larger screens and a slide-out
 * drawer on phones. Focus is trapped while open, Escape closes it and focus
 * returns to the menu button.
 */
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();
  // The panel is portalled to <body>: the sticky header uses backdrop-filter, which
  // would otherwise become the containing block for the fixed-position drawer.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Close when the route changes (a destination was chosen) — derived during render, no effect needed.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("a[aria-current='page']") ?? panel?.querySelector<HTMLElement>("nav a[href]");
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab" && panel) {
        const focusable = [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
        if (focusable.length === 0) return;
        const firstEl = focusable[0]!;
        const lastEl = focusable[focusable.length - 1]!;
        if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && panel) {
        const links = [...panel.querySelectorAll<HTMLElement>("nav a[href]")];
        const index = links.indexOf(document.activeElement as HTMLElement);
        if (index === -1) return;
        event.preventDefault();
        const next = event.key === "ArrowDown" ? (index + 1) % links.length : (index - 1 + links.length) % links.length;
        links[next]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // Lock page scroll behind the mobile drawer.
    const overflow = document.body.style.overflow;
    if (window.matchMedia("(max-width: 639px)").matches) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "relative grid size-10 place-items-center rounded-full border transition-colors duration-200",
          open ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg",
        )}
      >
        <span className="sr-only">{open ? t("menu.close") : t("menu.open")}</span>
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span
            className={cx(
              "absolute left-0 h-[1.6px] w-4 rounded-full bg-current transition-transform duration-300 ease-soft",
              open ? "top-1.5 rotate-45" : "top-0",
            )}
          />
          <span
            className={cx(
              "absolute top-1.5 left-0 h-[1.6px] w-4 rounded-full bg-current transition-opacity duration-200",
              open ? "opacity-0" : "opacity-100",
            )}
          />
          <span
            className={cx(
              "absolute left-0 h-[1.6px] rounded-full bg-current transition-all duration-300 ease-soft",
              open ? "top-1.5 w-4 -rotate-45" : "top-3 w-2.5",
            )}
          />
        </span>
      </button>

      {mounted &&
        createPortal(
          <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => close(false)}
        className={cx(
          "fixed inset-0 z-40 bg-overlay backdrop-blur-[2px] transition-opacity duration-300 sm:bg-transparent sm:backdrop-blur-none",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        style={{
          // Become visible immediately on open (so focus can move in); stay visible while fading out on close.
          transition: open
            ? "transform 420ms var(--ease-out-expo), opacity 260ms var(--ease-soft)"
            : "transform 300ms var(--ease-soft), opacity 220ms var(--ease-soft), visibility 0s linear 300ms",
        }}
        className={cx(
          "fixed z-50 flex flex-col border-line bg-surface/95 shadow-panel backdrop-blur-xl",
          // Phone: right-side drawer
          "inset-y-0 right-0 w-[min(86vw,360px)] border-l",
          // Larger screens: floating dropdown under the button
          "sm:inset-y-auto sm:top-[4.25rem] sm:right-6 sm:w-[340px] sm:origin-top-right sm:rounded-card sm:border lg:right-[max(2rem,calc((100vw-80rem)/2+2rem))]",
          open
            ? "visible translate-x-0 opacity-100 sm:scale-100"
            : "invisible translate-x-full opacity-100 sm:translate-x-0 sm:-translate-y-2 sm:scale-95 sm:opacity-0",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-4 sm:pt-3">
          <h2 id={titleId} className="text-sm font-medium text-muted">
            {t("menu.title")}
          </h2>
          <button
            type="button"
            onClick={() => close()}
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Icon name="close" size={18} />
            <span className="sr-only">{t("menu.close")}</span>
          </button>
        </div>
        <nav aria-label={t("menu.nav")} className="px-2.5 pb-3 sm:px-2 sm:pb-2">
          <ul className="flex flex-col gap-0.5">
            {ITEMS.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className={cx("ae-menu-item", open && "is-open")} style={{ ["--i" as string]: index }}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "group/item flex items-center gap-3.5 rounded-control px-3 py-2.5 outline-none transition-[background-color,transform] duration-200 ease-soft hover:translate-x-0.5",
                      "hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-strong",
                      active && "bg-accent-soft",
                    )}
                  >
                    <span
                      className={cx(
                        "grid size-9 shrink-0 place-items-center rounded-[0.65rem] border transition-[color,border-color,transform] duration-300 ease-spring group-hover/item:scale-110",
                        active ? "border-accent/50 text-accent" : "border-line text-muted",
                      )}
                    >
                      <Icon name={item.icon} size={18} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[15px] font-medium text-fg">{t(item.key)}</span>
                      <span className="truncate text-[13px] text-subtle">{t(`${item.key}.hint` as MessageKey)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
          </>,
          document.body,
        )}
    </>
  );
}
