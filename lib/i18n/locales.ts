/**
 * Supported interface languages. Add one by adding it here, writing a
 * messages file (lib/i18n/messages/), and adding its category and description
 * translations — tests fail until every key is covered.
 */
export const LOCALES = ["en", "ru", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_INFO: Record<Locale, { native: string; htmlLang: string; intl: string }> = {
  en: { native: "English", htmlLang: "en", intl: "en" },
  ru: { native: "Русский", htmlLang: "ru", intl: "ru" },
  ja: { native: "日本語", htmlLang: "ja", intl: "ja" },
  zh: { native: "中文（简体）", htmlLang: "zh-CN", intl: "zh-CN" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Best supported match for a list of BCP-47 tags (navigator.languages or Accept-Language). */
export function detectLocale(tags: readonly string[] | undefined | null): Locale {
  for (const tag of tags ?? []) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return "en";
}

/** Parse an Accept-Language header into tags ordered by preference. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag?.trim() ?? "", q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((x) => x.tag && x.tag !== "*")
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag)
    .slice(0, 10);
}
