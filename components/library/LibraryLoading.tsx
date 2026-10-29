"use client";

import { SkeletonGrid } from "@/components/library/ResultsGrid";
import { useI18n } from "@/components/settings/useI18n";
import type { LibraryScope } from "@/lib/types";

/** Route-level loading UI shown while the server renders a library page. */
export function LibraryLoading({ kind: _kind }: { kind: LibraryScope }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8" aria-busy="true" aria-label={t("lib.loadingLibrary")}>
      <div className="ae-skeleton h-10 w-72 rounded-full" />
      <div className="ae-skeleton mt-4 h-4 w-full max-w-xl rounded-full" />
      <div className="ae-skeleton mt-8 h-12 w-full max-w-3xl rounded-full" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="ae-skeleton h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-10">
        <SkeletonGrid />
      </div>
    </div>
  );
}
