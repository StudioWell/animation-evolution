"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/settings/useI18n";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

/** Page title + intro in the visitor's language, with a short staggered entrance. */
export function PageHeader({
  title,
  intro,
  className,
  children,
}: {
  title: MessageKey;
  intro?: MessageKey;
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className={cx("mb-8 max-w-3xl", className)}>
      <h1 className="ae-hero-line stretch-wide text-[clamp(2rem,4.4vw,3rem)] leading-[1.02] font-bold tracking-[-0.03em] text-balance text-fg">
        {t(title)}
      </h1>
      {intro && (
        <p className="ae-hero-line mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted" style={{ ["--i" as string]: 1 }}>
          {t(intro)}
        </p>
      )}
      {children}
    </header>
  );
}
