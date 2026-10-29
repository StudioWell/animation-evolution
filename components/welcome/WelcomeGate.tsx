"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { OnionTitle } from "@/components/home/OnionTitle";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { trapFocus } from "@/components/ui/Modal";
import { AboutDialog } from "@/components/welcome/AboutDialog";
import { cx } from "@/lib/format";

/**
 * The welcome screen shown once per visit (per browser session): the site's
 * name over a slow, warm shimmer, and three ways in — My Profile (left), Main
 * page (centre) and What is this website for? (right).
 *
 * Visibility lives on <html data-welcome>, which the head script sets from
 * sessionStorage before first paint, so a returning tab never flashes it.
 */
const STORAGE_KEY = "ae:welcome";
const EVENT = "ae:welcome-change";

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
const visible = () => document.documentElement.dataset.welcome !== "seen";

function setSeen(seen: boolean) {
  try {
    if (seen) sessionStorage.setItem(STORAGE_KEY, "seen");
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the screen still closes for this page view.
  }
  if (seen) document.documentElement.dataset.welcome = "seen";
  else delete document.documentElement.dataset.welcome;
  window.dispatchEvent(new Event(EVENT));
}

/** Show the welcome screen again (from the menu). */
export function openWelcome() {
  setSeen(false);
}

const reducedMotion = () =>
  document.documentElement.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function WelcomeGate() {
  const show = useSyncExternalStore(subscribe, visible, () => true);
  if (!show) return null;
  return <WelcomeScreen />;
}

function WelcomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [about, setAbout] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const leave = useCallback(
    (to?: string) => {
      if (leaving) return;
      setLeaving(true);
      if (to && to !== pathname) router.push(to);
      setTimeout(() => setSeen(true), reducedMotion() ? 0 : 420);
    },
    [leaving, pathname, router],
  );

  // Modal behaviour: focus the main action, keep Tab inside, lock page scroll.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || about) return;
    return trapFocus(root, () => leave());
  }, [about, leave]);

  const side =
    "ae-welcome__btn ae-btn ae-btn-ghost h-auto min-h-14 w-full justify-center rounded-full px-4 py-2 text-center text-[14px] leading-tight whitespace-normal backdrop-blur-sm sm:px-5 sm:text-[15px] sm:whitespace-nowrap";

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cx("ae-welcome", leaving && "is-leaving")}
    >
      <div aria-hidden="true" className="ae-welcome__glow">
        <span className="ae-welcome__blob ae-welcome__blob--1" />
        <span className="ae-welcome__blob ae-welcome__blob--2" />
        <span className="ae-welcome__blob ae-welcome__blob--3" />
        <span className="ae-welcome__blob ae-welcome__blob--4" />
      </div>
      <div aria-hidden="true" className="ae-welcome__vignette" />

      <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col items-center px-4 pt-[max(4.5rem,13vh)] pb-12 text-center sm:px-6">
        <p className="ae-welcome__rise text-[12px] font-medium tracking-[0.22em] text-accent-strong uppercase" style={{ ["--d" as string]: "0ms" }}>
          {t("welcome.label")}
        </p>
        <div className="ae-welcome__rise mt-5" style={{ ["--d" as string]: "80ms" }}>
          <OnionTitle
            as="h2"
            id={titleId}
            text="Animation Evolution"
            className="onion stretch-wide text-[clamp(2.7rem,9vw,6.4rem)] leading-[0.92] font-bold tracking-[-0.04em] text-fg"
          />
        </div>
        <p className="ae-welcome__rise mt-6 max-w-[34ch] text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-muted" style={{ ["--d" as string]: "160ms" }}>
          {t("welcome.tagline")}
        </p>

        {/* Main page in the middle, My Profile on the left, What is this website for? on the right.
            On phones Main page sits on its own row above the other two. */}
        <div className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-[1fr_1.15fr_1fr] sm:gap-4">
          <button
            type="button"
            onClick={() => leave("/profile")}
            className={cx(side, "ae-welcome__rise col-start-1 row-start-2 sm:row-start-1")}
            style={{ ["--d" as string]: "300ms" }}
          >
            <Icon name="user" size={18} className="shrink-0" />
            {t("welcome.profile")}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => leave("/")}
            className="ae-welcome__btn ae-welcome__rise ae-btn ae-btn-primary col-span-2 row-start-1 h-14 justify-center rounded-full px-6 text-[16px] font-semibold sm:col-span-1 sm:col-start-2"
            style={{ ["--d" as string]: "240ms" }}
          >
            <Icon name="home" size={18} />
            {t("welcome.main")}
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setAbout(true)}
            className={cx(side, "ae-welcome__rise col-start-2 row-start-2 sm:col-start-3 sm:row-start-1")}
            style={{ ["--d" as string]: "360ms" }}
          >
            <Icon name="info" size={18} className="hidden shrink-0 min-[420px]:block" />
            {t("welcome.about")}
          </button>
        </div>

        {pathname !== "/" && (
          <button
            type="button"
            onClick={() => leave()}
            className="ae-welcome__rise mt-7 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-subtle underline-offset-4 transition-colors hover:text-fg hover:underline"
            style={{ ["--d" as string]: "440ms" }}
          >
            {t("welcome.continue")}
            <Icon name="arrowRight" size={14} />
          </button>
        )}
      </div>

      <AboutDialog open={about} onClose={() => setAbout(false)} />
    </div>
  );
}
