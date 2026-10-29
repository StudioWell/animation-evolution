"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/settings/useI18n";
import { SearchField } from "@/components/ui/SearchField";
import { libraryHref } from "@/lib/search/query-string";

/** Homepage search: submits to the Video Library (everything) with the query applied. */
export function HomeSearch() {
  const router = useRouter();
  const { t, list } = useI18n();
  const [value, setValue] = useState("");

  return (
    <div className="w-full max-w-3xl">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(libraryHref("all", { q: value.trim() }));
        }}
      >
        <SearchField
          id="home-search"
          size="lg"
          label={t("home.search.label")}
          placeholder={t("home.search.placeholder")}
          value={value}
          onValueChange={setValue}
        />
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-1 text-subtle">{t("home.try")}</span>
        {list("home.examples").map((example, i) => (
          <Link
            key={example}
            href={libraryHref("all", { q: example })}
            className="ae-chip ae-pop-in"
            style={{ ["--i" as string]: i }}
          >
            {example}
          </Link>
        ))}
      </div>
    </div>
  );
}
