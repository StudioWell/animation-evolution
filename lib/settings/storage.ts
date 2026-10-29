import { detectLocale, LOCALE_INFO, type Locale } from "@/lib/i18n/locales";
import {
  COOKIE_NAME,
  DEFAULT_SETTINGS,
  LEGACY_COOKIE_NAME,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  parseSettings,
  type Settings,
} from "@/lib/settings/schema";

/**
 * Settings persistence with graceful fallback:
 *   1. localStorage (preferred), mirrored to a first-party cookie so a server can
 *      render the visitor's language and theme on the first response
 *   2. the cookie alone, if localStorage is blocked (some privacy modes)
 *   3. memory only, for this visit, if both are unavailable
 */

export type StorageMode = "local" | "cookie" | "memory";

/** The visitor's preferred supported language, from the browser. */
export function browserLocale(): Locale {
  try {
    return detectLocale(typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : []);
  } catch {
    return "en";
  }
}

let memory: Settings | null = null;

function localAvailable(): boolean {
  try {
    const probe = "__ae_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function cookieAvailable(): boolean {
  try {
    return typeof document !== "undefined" && navigator.cookieEnabled;
  } catch {
    return false;
  }
}

export function detectStorageMode(): StorageMode {
  if (typeof window === "undefined") return "memory";
  if (localAvailable()) return "local";
  if (cookieAvailable()) return "cookie";
  return "memory";
}

function readCookie(name = COOKIE_NAME): string | null {
  try {
    const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}

function writeCookie(value: string) {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked: nothing else to do.
  }
}

/** Defaults for a first visit: dark theme and the browser's language. */
export function firstVisitSettings(): Settings {
  return { ...DEFAULT_SETTINGS, language: browserLocale() };
}

export function loadSettings(mode: StorageMode = detectStorageMode()): Settings {
  const fallback = browserLocale();
  try {
    if (mode === "local") {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return parseSettings(JSON.parse(raw), fallback);
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? readCookie(LEGACY_COOKIE_NAME);
      return legacy ? fromLegacy(legacy, fallback) : firstVisitSettings();
    }
    if (mode === "cookie") {
      const raw = readCookie();
      if (raw) return parseSettings(JSON.parse(raw), fallback);
      const legacy = readCookie(LEGACY_COOKIE_NAME);
      return legacy ? fromLegacy(legacy, fallback) : firstVisitSettings();
    }
  } catch {
    // Corrupt value: fall through to defaults.
  }
  return memory ? { ...memory } : firstVisitSettings();
}

/** Settings saved before the dark theme became the default: keep everything but the theme. */
function fromLegacy(raw: string, fallback: Settings["language"]): Settings {
  return { ...parseSettings(JSON.parse(raw), fallback), theme: DEFAULT_SETTINGS.theme };
}

export function saveSettings(settings: Settings, mode: StorageMode = detectStorageMode()): StorageMode {
  const clean = parseSettings(settings, settings.language);
  const value = JSON.stringify(clean);
  memory = clean;
  try {
    if (mode === "local") {
      window.localStorage.setItem(STORAGE_KEY, value);
      writeCookie(value);
      return "local";
    }
    if (mode === "cookie") {
      writeCookie(value);
      return "cookie";
    }
  } catch {
    // Quota or privacy error — keep the in-memory copy.
  }
  return "memory";
}

/** Reflect settings on <html> so CSS can react without re-rendering React trees. */
export function applySettingsToDocument(settings: Settings): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.timestamps = settings.showTimestamps ? "on" : "off";
  root.dataset.motion = settings.reduceMotion ? "reduced" : "full";
  root.lang = LOCALE_INFO[settings.language].htmlLang;
  root.style.colorScheme = settings.theme === "light" ? "light" : "dark";
}
