/**
 * User settings: shape, defaults and validation. Safe on server and client.
 */
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const THEMES = ["dark", "light", "dark-brown"] as const;
export type ThemeId = (typeof THEMES)[number];

export interface Settings {
  theme: ThemeId;
  language: Locale;
  showTimestamps: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  theme: "dark",
  language: "en",
  showTimestamps: true,
  reduceMotion: false,
});

/**
 * v2: the dark theme became the site-wide default, so settings saved under v1
 * keep their language and preferences but start again on the dark theme.
 */
export const STORAGE_KEY = "ae-settings-v2";
export const COOKIE_NAME = "ae_settings2";
export const LEGACY_STORAGE_KEY = "ae-settings-v1";
export const LEGACY_COOKIE_NAME = "ae_settings";

/** Swatches for the theme picker: background, surface, text, accent. Labels come from translations. */
export const THEME_OPTIONS: { id: ThemeId; swatches: string[] }[] = [
  { id: "dark", swatches: ["#0D0C0F", "#232229", "#ECECEE", "#C6A37A"] },
  { id: "light", swatches: ["#FFFFFF", "#F1EADF", "#1F1B17", "#8C6A46"] },
  { id: "dark-brown", swatches: ["#1E1612", "#30251E", "#F3E9DC", "#D9BC94"] },
];

/** Accept only known keys and values; anything else falls back to the default. */
export function parseSettings(input: unknown, fallbackLanguage: Locale = DEFAULT_SETTINGS.language): Settings {
  const value = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  return {
    theme: THEMES.includes(value.theme as ThemeId) ? (value.theme as ThemeId) : DEFAULT_SETTINGS.theme,
    language: isLocale(value.language) ? value.language : fallbackLanguage,
    showTimestamps: typeof value.showTimestamps === "boolean" ? value.showTimestamps : DEFAULT_SETTINGS.showTimestamps,
    reduceMotion: typeof value.reduceMotion === "boolean" ? value.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
  };
}

/** Read the settings cookie on the server (Next.js layout) so the first render matches the visitor. */
export function parseSettingsCookie(raw: string | undefined | null, fallbackLanguage: Locale): Settings | null {
  if (!raw) return null;
  try {
    return parseSettings(JSON.parse(decodeURIComponent(raw)), fallbackLanguage);
  } catch {
    return null;
  }
}

export function settingsEqual(a: Settings, b: Settings): boolean {
  return (
    a.theme === b.theme &&
    a.language === b.language &&
    a.showTimestamps === b.showTimestamps &&
    a.reduceMotion === b.reduceMotion
  );
}
