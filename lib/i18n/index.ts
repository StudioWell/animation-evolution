import { getCategory, getGroup } from "@/lib/config/categories";
import { DESCRIPTIONS_I18N } from "@/lib/data/descriptions-i18n";
import { blurbNote, blurbText } from "@/lib/data/templates";
import { CATEGORY_I18N } from "@/lib/i18n/categories-i18n";
import { allTagNames, translateTag } from "@/lib/i18n/tags-i18n";
import { LOCALE_INFO, type Locale } from "@/lib/i18n/locales";
import { en, type MessageKey, type Messages } from "@/lib/i18n/messages/en";
import { ja } from "@/lib/i18n/messages/ja";
import { ru } from "@/lib/i18n/messages/ru";
import { zh } from "@/lib/i18n/messages/zh";
import type { Resource } from "@/lib/types";

export * from "@/lib/i18n/locales";
export type { MessageKey };

const DICTIONARIES: Record<Locale, Messages> = { en, ru, ja, zh };
type Vars = Record<string, string | number>;

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Translate a key; falls back to English, then to the key itself. */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const dict = DICTIONARIES[locale] as Record<string, string>;
  return fill(dict[key] ?? (en as Record<string, string>)[key] ?? key, vars);
}

const pluralRules = new Map<Locale, Intl.PluralRules>();
function rules(locale: Locale) {
  let r = pluralRules.get(locale);
  if (!r) {
    r = new Intl.PluralRules(LOCALE_INFO[locale].intl);
    pluralRules.set(locale, r);
  }
  return r;
}

/** Plural form: `base` + ".one" | ".few" | ".many" | ".other" chosen by the language's rules. */
export function plural(locale: Locale, base: string, count: number, vars?: Vars): string {
  const dict = DICTIONARIES[locale] as Record<string, string>;
  const form = rules(locale).select(count);
  const template = dict[`${base}.${form}`] ?? dict[`${base}.other`] ?? (en as Record<string, string>)[`${base}.other`] ?? base;
  return fill(template, { count: formatNumber(locale, count), ...vars });
}

/** Pipe-separated lists such as example searches. */
export function list(locale: Locale, key: MessageKey): string[] {
  return translate(locale, key).split("|").filter(Boolean);
}

// ---------- Numbers, dates, durations ----------
const numberFormats = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: Locale, compact: boolean) {
  const k = `${locale}:${compact}`;
  let f = numberFormats.get(k);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_INFO[locale].intl, compact ? { notation: "compact", maximumFractionDigits: 1 } : {});
    numberFormats.set(k, f);
  }
  return f;
}

export function formatNumber(locale: Locale, n: number): string {
  return numberFormat(locale, false).format(n);
}

export function formatViewsLocalized(locale: Locale, count: number | null | undefined): string | null {
  if (count == null || !Number.isFinite(count) || count < 0) return null;
  return translate(locale, "views.label", { n: numberFormat(locale, true).format(count) });
}

const dateFormats = new Map<Locale, Intl.DateTimeFormat>();
export function formatDateLocalized(locale: Locale, iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  let f = dateFormats.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    dateFormats.set(locale, f);
  }
  return f.format(date);
}

/** Spoken duration for screen readers, e.g. "12 минут 48 секунд". */
export function spokenDuration(locale: Locale, totalSeconds: number | null | undefined): string | null {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(plural(locale, "unit.hour", h));
  if (m) parts.push(plural(locale, "unit.minute", m));
  if (sec && !h) parts.push(plural(locale, "unit.second", sec));
  return parts.join(locale === "ja" || locale === "zh" ? "" : " ");
}

// ---------- Categories and resource text ----------
export function categoryName(locale: Locale, slug: string): string {
  if (locale !== "en") {
    const hit = CATEGORY_I18N[locale].categories[slug];
    if (hit) return hit;
  }
  return getCategory(slug)?.label ?? slug;
}

export function groupName(locale: Locale, slug: string): string {
  if (locale !== "en") {
    const hit = CATEGORY_I18N[locale].groups[slug]?.label;
    if (hit) return hit;
  }
  return getGroup(slug)?.label ?? slug;
}

export function groupDescription(locale: Locale, slug: string): string {
  if (locale !== "en") {
    const hit = CATEGORY_I18N[locale].groups[slug]?.description;
    if (hit) return hit;
  }
  return getGroup(slug)?.description ?? "";
}

export function describe(locale: Locale, resource: Resource): string {
  if (locale === "en") return resource.description;
  const hit = DESCRIPTIONS_I18N[locale][resource.id]?.description;
  if (hit) return hit;
  return resource.blurb ? blurbText(locale, resource) : resource.description;
}

export function accessNote(locale: Locale, resource: Resource): string | undefined {
  if (!resource.accessNote) return undefined;
  if (locale === "en") return resource.accessNote;
  return DESCRIPTIONS_I18N[locale][resource.id]?.accessNote ?? blurbNote(locale, resource) ?? resource.accessNote;
}

/** Every localized name a category goes by — used to make search work in all languages. */
export function allCategoryNames(slug: string): string[] {
  return (["ru", "ja", "zh"] as const).map((l) => CATEGORY_I18N[l].categories[slug]).filter((x): x is string => Boolean(x));
}

/** A filter value's label in every language, e.g. allFacetNames("media", "anime"). */
export function allFacetNames(prefix: "ctype" | "media" | "tech" | "move", value: string): string[] {
  const key = `${prefix}.${value}`;
  return (Object.keys(DICTIONARIES) as Locale[]).map((l) => (DICTIONARIES[l] as Record<string, string>)[key]).filter((x): x is string => Boolean(x));
}

export function allDescriptions(id: string): string[] {
  return (["ru", "ja", "zh"] as const).map((l) => DESCRIPTIONS_I18N[l][id]?.description ?? "").filter(Boolean);
}


export function tagName(locale: Locale, tag: string): string {
  return translateTag(locale, tag);
}

export { allTagNames };
