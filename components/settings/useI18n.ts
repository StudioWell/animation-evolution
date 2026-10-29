"use client";

import { useMemo } from "react";
import {
  accessNote,
  categoryName,
  describe,
  formatDateLocalized,
  formatNumber,
  formatViewsLocalized,
  groupDescription,
  groupName,
  list,
  plural,
  spokenDuration,
  tagName,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";
import type { Resource } from "@/lib/types";
import { useSettings } from "@/components/settings/SettingsProvider";

type Vars = Record<string, string | number>;

export interface I18n {
  locale: Locale;
  t: (key: MessageKey, vars?: Vars) => string;
  plural: (base: string, count: number, vars?: Vars) => string;
  list: (key: MessageKey) => string[];
  cat: (slug: string) => string;
  group: (slug: string) => string;
  groupDesc: (slug: string) => string;
  describe: (resource: Resource) => string;
  accessNote: (resource: Resource) => string | undefined;
  date: (iso: string | null | undefined) => string | null;
  views: (count: number | null | undefined) => string | null;
  spoken: (seconds: number | null | undefined) => string | null;
  number: (n: number) => string;
  tag: (tag: string) => string;
}

/** Translation helpers bound to the visitor's chosen language. */
export function useI18n(): I18n {
  const { settings } = useSettings();
  const locale = settings.language;
  return useMemo<I18n>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      plural: (base, count, vars) => plural(locale, base, count, vars),
      list: (key) => list(locale, key),
      cat: (slug) => categoryName(locale, slug),
      group: (slug) => groupName(locale, slug),
      groupDesc: (slug) => groupDescription(locale, slug),
      describe: (resource) => describe(locale, resource),
      accessNote: (resource) => accessNote(locale, resource),
      date: (iso) => formatDateLocalized(locale, iso),
      views: (count) => formatViewsLocalized(locale, count),
      spoken: (seconds) => spokenDuration(locale, seconds),
      number: (n) => formatNumber(locale, n),
      tag: (tag) => tagName(locale, tag),
    }),
    [locale],
  );
}
