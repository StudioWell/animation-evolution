"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/components/settings/useI18n";

/** Route error boundary. Shows a plain message; details stay in the server/browser logs. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="ae-rise mx-auto flex max-w-3xl flex-col items-start px-4 pt-20 pb-10 sm:px-6">
      <p className="text-sm text-danger">{t("err.eyebrow")}</p>
      <h1 className="stretch-wide mt-2 text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.08] font-bold tracking-[-0.03em] text-fg">{t("err.title")}</h1>
      <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-muted">
        {t("err.body")}
        {error.digest && <span className="mt-2 block text-[13px] text-subtle">{t("err.code", { code: error.digest })}</span>}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="ae-btn ae-btn-primary h-11">
          {t("err.retry")}
        </button>
        <Link href="/" className="ae-btn ae-btn-ghost h-11">
          {t("err.home")}
        </Link>
      </div>
    </div>
  );
}
