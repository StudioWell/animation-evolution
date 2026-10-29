"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/** Homepage/related section: heading, optional one-line context, optional "View all". Reveals as it scrolls in. */
export function Section({
  id,
  title,
  description,
  viewAllHref,
  viewAllLabel,
  children,
  className,
  band = false,
}: {
  id: string;
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
  className?: string;
  /** Sit the section on the lighter warm band. */
  band?: boolean;
}) {
  const { t } = useI18n();
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={cx("ae-reveal scroll-mt-24", band && "ae-band -mx-2 px-4 py-6 sm:-mx-4 sm:px-6 sm:py-8", className)}>
      <div className="mb-5 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h2 id={headingId} className="stretch-semi text-[1.35rem] leading-tight font-semibold tracking-[-0.015em] text-balance text-fg">
            {title}
          </h2>
          {description && <p className="mt-1.5 max-w-[60ch] text-sm text-muted">{description}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="ae-btn-chip group shrink-0">
            {viewAllLabel ?? t("section.viewAll")}
            <Icon name="chevronRight" size={15} className="-mr-1 transition-transform duration-300 ease-spring group-hover:translate-x-0.5" />
            <span className="sr-only"> — {title}</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
