"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ResultsGrid, SkeletonGrid } from "@/components/library/ResultsGrid";
import { MySubmissions, SubmitVideoForm } from "@/components/community/SubmitVideo";
import { Avatar } from "@/components/profile/Avatar";
import { useProfile } from "@/components/profile/ProfileProvider";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { LOCALE_INFO } from "@/lib/i18n/locales";
import { renderGoogleButton } from "@/lib/profile/google";
import { NAME_MAX, photoFromFile } from "@/lib/profile/storage";
import type { Resource } from "@/lib/types";

/**
 * My Profile: sign in (Google, or the claude.ai account when the site runs as
 * an artifact), set a name and photo, then see and manage saved videos.
 */
export function ProfileView() {
  const { status } = useProfile();
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 sm:pt-14 lg:px-8">
      {status === "loading" && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <span className="ae-spinner" aria-hidden="true" />
          {t("profile.loading")}
        </p>
      )}
      {status === "signed-out" && <SignIn />}
      {status === "setup" && <Setup />}
      {status === "ready" && <Ready />}
    </div>
  );
}

function SignIn() {
  const { t, locale } = useI18n();
  const { methods, signIn, signInError } = useProfile();
  const [busy, setBusy] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);
  const [googleError, setGoogleError] = useState<"failed" | "blocked" | null>(null);

  useEffect(() => {
    const el = googleRef.current;
    if (methods.google !== "button" || !el) return;
    el.replaceChildren();
    renderGoogleButton(el, {
      locale: LOCALE_INFO[locale].htmlLang,
      width: el.clientWidth || 320,
      onSignIn: (identity) => void signIn("google", { id: identity.sub, email: identity.email, name: identity.name }),
      onError: () => setGoogleError("failed"),
    }).catch(() => setGoogleError("blocked"));
  }, [methods.google, locale, signIn]);

  const nothing = !methods.google && !methods.claude;
  return (
    <section className="ae-page mx-auto flex max-w-md flex-col items-center text-center">
      <span className="grid size-20 place-items-center rounded-full bg-accent-soft text-accent-strong ring-1 ring-line-strong">
        <Icon name="user" size={34} />
      </span>
      <h1 className="stretch-wide mt-6 text-[clamp(2rem,4.4vw,2.8rem)] leading-[1.02] font-bold tracking-[-0.03em] text-fg">
        {t("profile.title")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{t(methods.google === "popup" ? "profile.signin.googleLead" : "profile.signin.lead")}</p>

      <div className="mt-8 flex w-full flex-col items-stretch gap-3">
        {methods.google === "button" && <div ref={googleRef} className="flex min-h-11 w-full justify-center" />}
        {methods.google === "popup" && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await signIn("google");
              setBusy(false);
            }}
            className="ae-btn ae-btn-primary ae-btn-lg w-full"
          >
            {busy ? <span className="ae-spinner" aria-hidden="true" /> : <GoogleMark />}
            {t("profile.signin.google")}
          </button>
        )}
        {signInError === "popup" && (
          <p role="alert" className="text-[13px] text-muted">
            {t("profile.signin.popupError")}
          </p>
        )}
        {googleError && (
          <p role="alert" className="text-[13px] text-muted">
            {t(googleError === "blocked" ? "profile.signin.googleBlocked" : "profile.signin.googleError")}
          </p>
        )}
        {methods.google && methods.claude && <Divider label={t("profile.signin.or")} />}
        {methods.claude && (
          <>
            <button type="button" onClick={() => void signIn("claude")} className="ae-btn ae-btn-primary ae-btn-lg w-full">
              <Icon name="user" size={18} />
              {t("profile.signin.claude")}
            </button>
            {methods.claude.name && <p className="text-[12.5px] text-subtle">{t("profile.signin.claudeAs", { name: methods.claude.name })}</p>}
          </>
        )}
        {nothing && (
          <>
            <p className="rounded-control border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted">
              {t("profile.signin.noGoogle")}
            </p>
            <button type="button" onClick={() => void signIn("device")} className="ae-btn ae-btn-primary ae-btn-lg w-full">
              <Icon name="user" size={18} />
              {t("profile.signin.device")}
            </button>
          </>
        )}
      </div>
      <p className="mt-8 flex items-start gap-2 text-left text-[12.5px] leading-relaxed text-subtle">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        {t(methods.claude ? "profile.privacy.synced" : methods.google === "popup" ? "profile.privacy.google" : "profile.privacy")}
      </p>
    </section>
  );
}

/** Google's "G" mark, as Google's sign-in branding guidelines ask for on a Google sign-in button. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="rounded-full bg-white p-[2px]">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4 6.8-10 6.8-17.3z" />
      <path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-subtle uppercase">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Name + photo form, used for first-time setup and for editing. */
function ProfileForm({ onDone, onCancel, submitLabel }: { onDone?: () => void; onCancel: () => void; submitLabel: string }) {
  const { t } = useI18n();
  const { account, profile, saveProfile } = useProfile();
  const [name, setName] = useState(profile?.name ?? account?.suggestedName ?? "");
  const [photo, setPhoto] = useState<string | null>(profile?.photo ?? null);
  const [error, setError] = useState<"name" | "photo" | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const errorId = useId();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await photoFromFile(file));
      setError((e) => (e === "photo" ? null : e));
    } catch {
      setError("photo");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("name");
      return;
    }
    setBusy(true);
    await saveProfile({ name, photo });
    setBusy(false);
    onDone?.();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative rounded-full outline-offset-4"
          aria-label={photo ? t("profile.photo.change") : t("profile.photo.choose")}
        >
          <Avatar name={name || "?"} photo={photo} size={104} />
          <span className="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full border border-line-strong bg-surface-2 text-fg shadow-lg transition-transform duration-300 ease-spring group-hover:scale-110">
            <Icon name="camera" size={16} />
          </span>
        </button>
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm font-medium text-fg">{t("profile.photo")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="ae-btn ae-btn-ghost">
              <Icon name="image" size={16} />
              {photo ? t("profile.photo.change") : t("profile.photo.choose")}
            </button>
            {photo && (
              <button type="button" onClick={() => setPhoto(null)} className="ae-btn ae-btn-quiet">
                {t("profile.photo.remove")}
              </button>
            )}
          </div>
          <p className="text-[12.5px] text-subtle">{t("profile.photo.hint")}</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>
      {error === "photo" && (
        <p role="alert" className="-mt-3 text-[13px] text-accent-strong">
          {t("profile.photo.error")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className="text-sm font-medium text-fg">
          {t("profile.name")}
        </label>
        <input
          id={nameId}
          value={name}
          maxLength={NAME_MAX}
          autoComplete="nickname"
          placeholder={t("profile.name.placeholder")}
          aria-invalid={error === "name"}
          aria-describedby={error === "name" ? errorId : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (error === "name") setError(null);
          }}
          className="h-12 w-full max-w-md rounded-control border border-line-strong bg-surface px-4 text-[15px] text-fg placeholder:text-subtle focus:border-accent focus:outline-none"
        />
        {error === "name" && (
          <p id={errorId} role="alert" className="text-[13px] text-accent-strong">
            {t("profile.name.required")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={busy} className="ae-btn ae-btn-primary ae-btn-lg">
          <Icon name="check" size={17} />
          {busy ? t("profile.saving") : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="ae-btn ae-btn-quiet ae-btn-lg">
          {t("profile.cancel")}
        </button>
      </div>
    </form>
  );
}

function Setup() {
  const { t } = useI18n();
  const { signOut } = useProfile();
  return (
    <section className="ae-page mx-auto max-w-xl">
      <h1 className="stretch-wide text-[clamp(2rem,4.4vw,2.8rem)] leading-[1.02] font-bold tracking-[-0.03em] text-fg">{t("profile.setup.title")}</h1>
      <p className="mt-3 mb-8 text-[15px] leading-relaxed text-muted">{t("profile.setup.lead")}</p>
      <div className="ae-band p-6 sm:p-8">
        <ProfileForm submitLabel={t("profile.save")} onCancel={signOut} />
      </div>
    </section>
  );
}

function Ready() {
  const { t } = useI18n();
  const { account, profile, signOut } = useProfile();
  const [editing, setEditing] = useState(false);
  if (!profile || !account) return null;
  const via = t(account.provider === "google" ? "profile.via.google" : account.provider === "claude" ? "profile.via.claude" : "profile.via.device");

  return (
    <div className="ae-page">
      <section className="ae-band flex flex-col gap-6 p-6 sm:p-8">
        {editing ? (
          <>
            <h1 className="stretch-semi text-2xl font-semibold tracking-[-0.02em] text-fg">{t("profile.edit")}</h1>
            <ProfileForm submitLabel={t("profile.save")} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
          </>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={profile.name} photo={profile.photo} size={96} />
            <div className="min-w-0 flex-1">
              <h1 className="stretch-wide truncate text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.05] font-bold tracking-[-0.03em] text-fg">{profile.name}</h1>
              <p className="mt-1.5 truncate text-[13.5px] text-muted">
                {via}
                {account.email ? ` · ${account.email}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditing(true)} className="ae-btn ae-btn-ghost">
                <Icon name="pencil" size={15} />
                {t("profile.edit")}
              </button>
              <button type="button" onClick={signOut} className="ae-btn ae-btn-quiet">
                <Icon name="logout" size={15} />
                {t("profile.signout")}
              </button>
            </div>
          </div>
        )}
      </section>
      <SubmitVideoForm />
      <MySubmissions />
      <SavedVideos ids={profile.saved} />
    </div>
  );
}

function SavedVideos({ ids }: { ids: string[] }) {
  const { t, plural } = useI18n();
  const [items, setItems] = useState<Resource[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = ids.join(",");

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!key) return setItems([]);
      setFailed(false);
      try {
        const response = await fetch(`/api/library/items?ids=${encodeURIComponent(key)}`, { signal });
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { items: Resource[] };
        setItems(body.items);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailed(true);
      }
    },
    [key],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, attempt]);

  // Keep the grid in step with un-saving from a card on this page.
  const shown = items?.filter((item) => ids.includes(item.id)) ?? null;

  return (
    <section aria-labelledby="saved-title" className="mt-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="saved-title" className="stretch-semi text-xl font-semibold tracking-[-0.02em] text-fg">
          {t("profile.saved.title")}
        </h2>
        {ids.length > 0 && <p className="text-sm text-muted tabular">{plural("profile.saved.count", ids.length)}</p>}
      </div>
      {failed ? (
        <div className="flex flex-col items-start gap-3 rounded-control border border-line bg-surface px-5 py-4 text-sm text-muted">
          {t("profile.saved.error")}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="ae-btn ae-btn-ghost">
            <Icon name="refresh" size={15} />
            {t("profile.saved.retry")}
          </button>
        </div>
      ) : ids.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-line-strong px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <Icon name="bookmark" size={20} />
          </span>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted">{t("profile.saved.empty")}</p>
          <Link href="/library" className="ae-btn ae-btn-primary">
            <Icon name="search" size={16} />
            {t("profile.saved.browse")}
          </Link>
        </div>
      ) : shown === null ? (
        <SkeletonGrid count={Math.min(ids.length, 8)} />
      ) : (
        <ResultsGrid items={shown} />
      )}
    </section>
  );
}
