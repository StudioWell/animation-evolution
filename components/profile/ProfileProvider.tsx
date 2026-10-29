"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { firebaseAvailable, signInWithGoogle, signOutFirebase, watchFirebaseUser } from "@/lib/firebase/client";
import { firebaseRemote } from "@/lib/profile/firebase-remote";
import { googleConfigured, googleSignOut } from "@/lib/profile/google";
import {
  claudeViewer,
  cleanName,
  local,
  newDeviceId,
  remote,
  SAVED_MAX,
  type Account,
  type ProfileData,
  type Provider,
} from "@/lib/profile/storage";

/**
 * The visitor's profile: who is signed in, their name and photo, and the videos
 * they saved. "setup" means signed in but no profile yet (first visit).
 */
export type ProfileStatus = "loading" | "signed-out" | "setup" | "ready";

interface ProfileContextValue {
  status: ProfileStatus;
  account: Account | null;
  profile: ProfileData | null;
  /**
   * Sign-in methods this copy of the site offers. google: "popup" is Google
   * sign-in through Firebase (accounts that can publish videos); "button" is
   * Google's own sign-in button (identity only).
   */
  methods: { google: "popup" | "button" | null; claude: { name: string } | null };
  /** Set when the last sign-in attempt failed (popup closed or blocked). */
  signInError: "popup" | null;
  /** True when the profile is also stored with the visitor's account (not only this browser). */
  synced: boolean;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => boolean | null;
  signIn: (provider: Provider, identity?: { id: string; email: string | null; name: string }) => Promise<void>;
  saveProfile: (patch: { name: string; photo: string | null }) => Promise<void>;
  signOut: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const now = () => new Date().toISOString();

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [claude, setClaude] = useState<{ id: string; name: string } | null>(null);
  const [synced, setSynced] = useState(false);
  const [signInError, setSignInError] = useState<"popup" | null>(null);
  const popup = useMemo(() => firebaseAvailable(), []);
  const google = useMemo(() => (popup ? "popup" : googleConfigured() ? "button" : null), [popup]);
  // Accounts whose profile is also stored with the account: claude.ai in the artifact, Google on the Firebase site.
  const remoteFor = useCallback((acc: Account) => (acc.provider === "claude" ? "claude" : acc.provider === "google" && popup ? "firebase" : null), [popup]);
  // Serialise account writes: one at a time per document.
  const writing = useRef<Promise<unknown>>(Promise.resolve());

  const persist = useCallback((acc: Account, data: ProfileData) => {
    local.setProfile(acc, data);
    const where = remoteFor(acc);
    if (!where) return;
    writing.current = writing.current.then(() => (where === "claude" ? remote.save(acc, data) : firebaseRemote.save(acc.id, data)).then(setSynced));
  }, [remoteFor]);

  const load = useCallback(async (acc: Account | null) => {
    setAccount(acc);
    if (!acc) {
      setProfile(null);
      setStatus("signed-out");
      return;
    }
    let data = local.profile(acc);
    setProfile(data);
    setStatus(data ? "ready" : "setup");
    const where = remoteFor(acc);
    if (where) {
      const fromAccount = where === "claude" ? await remote.load(acc) : await firebaseRemote.load(acc.id);
      if (fromAccount && (!data || fromAccount.updatedAt >= data.updatedAt)) {
        data = fromAccount;
        local.setProfile(acc, data);
        setProfile(data);
        setStatus("ready");
      }
      setSynced(Boolean(fromAccount));
    }
  }, [remoteFor]);

  useEffect(() => {
    void load(local.account());
    let alive = true;
    claudeViewer().then((viewer) => alive && setClaude(viewer));
    const onStorage = (event: StorageEvent) => {
      if (local.watches(event.key)) void load(local.account());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [load]);

  // Keep the site's Google account in step with the Firebase sign-in (restored sessions, sign-out in another tab).
  useEffect(() => {
    if (!popup) return;
    return watchFirebaseUser((user) => {
      const acc = local.account();
      if (user) {
        if (acc && acc.provider !== "google") return;
        const next: Account = acc?.id === user.uid ? acc : { provider: "google", id: user.uid, email: user.email, suggestedName: cleanName(user.displayName) };
        if (next !== acc) local.setAccount(next);
        void load(next);
      } else if (acc?.provider === "google") {
        local.setAccount(null);
        void load(null);
      }
    });
  }, [popup, load]);

  const signIn = useCallback<ProfileContextValue["signIn"]>(
    async (provider, identity) => {
      let acc: Account;
      if (provider === "claude") {
        const viewer = claude ?? (await claudeViewer());
        if (!viewer) return;
        acc = { provider, id: viewer.id, email: null, suggestedName: viewer.name };
      } else if (provider === "google" && popup) {
        setSignInError(null);
        const user = await signInWithGoogle().catch(() => null);
        if (!user) return setSignInError("popup");
        acc = { provider, id: user.uid, email: user.email, suggestedName: cleanName(user.displayName) };
      } else if (provider === "google") {
        if (!identity) return;
        acc = { provider, id: identity.id, email: identity.email, suggestedName: cleanName(identity.name) };
      } else {
        acc = { provider, id: newDeviceId(), email: null, suggestedName: "" };
      }
      local.setAccount(acc);
      await load(acc);
    },
    [claude, load, popup],
  );

  const saveProfile = useCallback<ProfileContextValue["saveProfile"]>(
    async ({ name, photo }) => {
      if (!account) return;
      const clean = cleanName(name);
      if (!clean) return;
      const next: ProfileData = { name: clean, photo, saved: profile?.saved ?? [], updatedAt: now() };
      setProfile(next);
      setStatus("ready");
      persist(account, next);
      await writing.current;
    },
    [account, profile, persist],
  );

  const toggleSave = useCallback<ProfileContextValue["toggleSave"]>(
    (id) => {
      if (!account || !profile) return null;
      const has = profile.saved.includes(id);
      const saved = has ? profile.saved.filter((s) => s !== id) : [id, ...profile.saved].slice(0, SAVED_MAX);
      const next = { ...profile, saved, updatedAt: now() };
      setProfile(next);
      persist(account, next);
      return !has;
    },
    [account, profile, persist],
  );

  const signOut = useCallback(() => {
    if (account?.provider === "google") {
      if (popup) void signOutFirebase();
      else googleSignOut();
    }
    local.setAccount(null);
    setSynced(false);
    void load(null);
  }, [account, load, popup]);

  const savedSet = useMemo(() => new Set(profile?.saved ?? []), [profile]);
  const value = useMemo<ProfileContextValue>(
    () => ({
      status,
      account,
      profile,
      methods: { google, claude: claude ? { name: claude.name } : null },
      signInError,
      synced,
      isSaved: (id) => savedSet.has(id),
      toggleSave,
      signIn,
      saveProfile,
      signOut,
    }),
    [status, account, profile, google, claude, signInError, synced, savedSet, toggleSave, signIn, saveProfile, signOut],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}

/** Initials for an avatar without a photo. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]!, parts[parts.length - 1]!] : parts;
  return letters.map((p) => Array.from(p)[0]?.toUpperCase() ?? "").join("") || "?";
}
