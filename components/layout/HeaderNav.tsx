"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/components/settings/useI18n";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

const LINKS: { href: string; key: MessageKey }[] = [
  { href: "/library", key: "header.library" },
  { href: "/references", key: "header.references" },
  { href: "/tutorials", key: "header.tutorials" },
  { href: "/categories", key: "header.categories" },
];

/**
 * Quick links for wider screens; the full navigation lives in the menu.
 * A single pill slides between the links to mark the current section.
 */
export function HeaderNav() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const activeIndex = LINKS.findIndex((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));

  useLayoutEffect(() => {
    const list = listRef.current;
    const measure = () => {
      const el = activeIndex >= 0 ? list?.querySelectorAll<HTMLElement>("a")[activeIndex] : null;
      if (!el || !list) return setPill(null);
      // Measure against the list itself (each <li> is its own offsetParent).
      const box = el.getBoundingClientRect();
      setPill({ left: box.left - list.getBoundingClientRect().left, width: box.width });
    };
    measure();
    // Link widths change with the language and once web fonts load.
    const observer = new ResizeObserver(measure);
    if (list) observer.observe(list);
    return () => observer.disconnect();
  }, [activeIndex, locale]);

  return (
    <nav aria-label={t("header.libraries")} className="ml-6 hidden md:block">
      <ul ref={listRef} className="relative flex items-center gap-1">
        <span
          aria-hidden="true"
          className={cx(
            "absolute top-0 bottom-0 rounded-full bg-surface-2 ring-1 ring-line transition-[left,width,opacity] duration-500 ease-out-expo",
            pill ? "opacity-100" : "opacity-0",
          )}
          style={pill ? { left: pill.left, width: pill.width } : undefined}
        />
        {LINKS.map((link, i) => (
          <li key={link.href} className="relative">
            <Link
              href={link.href}
              aria-current={i === activeIndex ? "page" : undefined}
              className={cx(
                "block rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200",
                i === activeIndex ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
