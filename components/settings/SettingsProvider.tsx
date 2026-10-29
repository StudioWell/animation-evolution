"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { translate, type MessageKey } from "@/lib/i18n";
import { DEFAULT_SETTINGS, settingsEqual, STORAGE_KEY, type Settings } from "@/lib/settings/schema";
import {
  applySettingsToDocument,
  detectStorageMode,
  firstVisitSettings,
  loadSettings,
  saveSettings,
  type StorageMode,
} from "@/lib/settings/storage";

/**
 * Global settings store. Settings live in browser storage (see lib/settings/storage.ts)
 * and are mirrored onto <html data-* lang> attributes, which is what the CSS reads.
 * A small external store keeps every subscriber (and other tabs) in sync.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
let current: Settings = DEFAULT_SETTINGS;
let mode: StorageMode = "memory";
let initialised = false;

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  mode = detectStorageMode();
  current = loadSettings(mode);
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = loadSettings(mode);
    if (!settingsEqual(next, current)) {
      current = next;
      applySettingsToDocument(current);
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(listener: Listener) {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Settings {
  init();
  return current;
}

function getMode(): StorageMode {
  init();
  return mode;
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(listener: Listener) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function getMotion(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}

function commit(next: Settings) {
  current = next;
  mode = saveSettings(next, mode);
  applySettingsToDocument(next);
  listeners.forEach((l) => l());
}

/**
 * Theme and language changes cross-fade the whole page with the View Transitions
 * API where the browser supports it, unless the visitor asked for less motion.
 */
function commitWithTransition(next: Settings) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = next.reduceMotion || getMotion();
  const visual = next.theme !== current.theme || next.language !== current.language;
  if (visual && !reduce && typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => flushSync(() => commit(next)));
  } else {
    commit(next);
  }
}

interface Toast {
  id: number;
  message: string;
}

interface SettingsContextValue {
  settings: Settings;
  storageMode: StorageMode;
  /** Apply a change; `toast` is a message key (with values) shown in the language that is active after the change. */
  update: (patch: Partial<Settings>, toast?: { key: MessageKey; vars?: Record<string, string | number> }) => void;
  reset: () => void;
  notify: (message: string) => void;
  prefersReducedMotion: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children, initial }: { children: ReactNode; initial?: Settings }) {
  const getServerSnapshot = useCallback(() => initial ?? DEFAULT_SETTINGS, [initial]);
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const storageMode = useSyncExternalStore(subscribe, getMode, () => "local" as StorageMode);
  const prefersReducedMotion = useSyncExternalStore(subscribeMotion, getMotion, () => false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Re-apply attributes in case the pre-paint script couldn't run (e.g. blocked inline scripts).
    applySettingsToDocument(getSnapshot());
  }, []);

  const notify = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  const update = useCallback<SettingsContextValue["update"]>(
    (patch, toast) => {
      const next = { ...getSnapshot(), ...patch };
      commitWithTransition(next);
      if (toast) notify(translate(next.language, toast.key, toast.vars));
    },
    [notify],
  );

  const reset = useCallback(() => {
    const next = firstVisitSettings();
    commitWithTransition(next);
    notify(translate(next.language, "toast.reset"));
  }, [notify]);

  const value = useMemo(
    () => ({ settings, storageMode, update, reset, notify, prefersReducedMotion }),
    [settings, storageMode, update, reset, notify, prefersReducedMotion],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="ae-toast pointer-events-auto flex items-center gap-2.5 rounded-full border border-line-strong bg-surface-2/95 py-2.5 pr-5 pl-3.5 text-sm text-fg shadow-panel backdrop-blur-md"
          >
            <span className="grid size-5 place-items-center rounded-full bg-accent text-accent-ink">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside <SettingsProvider>");
  return value;
}
