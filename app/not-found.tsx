"use client";

import Link from "next/link";
import { useI18n } from "@/components/settings/useI18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 pt-20 pb-10 sm:px-6">
      <p className="ae-hero-line text-sm text-accent">{t("nf.eyebrow")}</p>
      <h1 className="ae-hero-line stretch-wide mt-2 text-[clamp(2rem,4.4vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-fg" style={{ ["--i" as string]: 1 }}>
        {t("nf.title")}
      </h1>
      <p className="ae-hero-line mt-4 max-w-[56ch] text-[15px] leading-relaxed text-muted" style={{ ["--i" as string]: 2 }}>
        {t("nf.body")}
      </p>
      <div className="ae-hero-line mt-8 flex flex-wrap gap-3" style={{ ["--i" as string]: 3 }}>
        <Link href="/library" className="ae-btn ae-btn-primary h-11">
          {t("nf.library")}
        </Link>
        <Link href="/references" className="ae-btn ae-btn-ghost h-11">
          {t("nf.references")}
        </Link>
        <Link href="/tutorials" className="ae-btn ae-btn-ghost h-11">
          {t("nf.tutorials")}
        </Link>
      </div>
    </div>
  );
}
