"use client";

import { useI18n } from "@/components/settings/useI18n";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-[80] -translate-y-20 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-transform duration-300 ease-spring focus:translate-y-0"
    >
      {t("skip")}
    </a>
  );
}
