import { firebase, firebaseAssets, firebaseAvailable, firestoreDb, isOwnerUser, watchFirebaseUser } from "@/lib/firebase/client";

/**
 * Access to the claude.ai artifact runtime for community videos: who is
 * viewing (and whether they own the site), the shared database and the asset
 * store for uploaded video files — or, on the public site, the same shapes
 * backed by Firebase (Google sign-in). Resolves to null when neither exists.
 */

interface Snap {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface QuerySnap {
  docs: Snap[];
}
type Unsubscribe = () => void;
export interface DocRef {
  get(): Promise<Snap>;
  set(data: Record<string, unknown>): Promise<void>;
  update(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (s: Snap) => void, error?: (e: unknown) => void): Unsubscribe;
}
export interface Db {
  doc(path: string): DocRef;
  collection(path: string): { onSnapshot(next: (s: QuerySnap) => void, error?: (e: unknown) => void): Unsubscribe };
}
export interface Assets {
  upload(blob: Blob, options?: { type?: string }): Promise<{ id: string; url: string; sizeBytes: number; contentType: string }>;
  delete(id: string): Promise<void>;
}
interface User {
  id(): Promise<string | null>;
  isOwner(): Promise<boolean>;
}

type ClaudeWindow = Window & { claude?: { use?: (name: string) => Promise<unknown> } };

function capability<T>(name: string, timeoutMs = 5000): Promise<T | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const claude = (window as ClaudeWindow).claude;
  if (typeof claude?.use !== "function") return Promise.resolve(null);
  return Promise.race([
    Promise.resolve(claude.use(name)).then((v) => (v ?? null) as T | null, () => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export interface Viewer {
  id: string;
  isOwner: boolean;
}

export interface CommunityRuntime {
  /** "claude": the claude.ai artifact runtime; "firebase": the public site with Google sign-in. */
  kind: "claude" | "firebase";
  db: Db;
  /** Asset store for the given viewer, or null when they may not upload files (links still work). */
  assetsFor(viewerId: string): Assets | null;
  /** Calls back with the signed-in viewer now and whenever it changes. */
  watchViewer(next: (viewer: Viewer | null) => void): () => void;
}

let pending: Promise<CommunityRuntime | null> | null = null;

async function claudeRuntime(): Promise<CommunityRuntime | null> {
  const [db, user, assets] = await Promise.all([capability<Db>("db"), capability<User>("user"), capability<Assets>("assets")]);
  if (!db) return null;
  const [viewerId, isOwner] = user ? await Promise.all([user.id().catch(() => null), user.isOwner().catch(() => false)]) : [null, false];
  const viewer = viewerId ? { id: viewerId, isOwner } : null;
  return {
    kind: "claude",
    db,
    assetsFor: () => assets,
    watchViewer: (next) => {
      next(viewer);
      return () => undefined;
    },
  };
}

async function firebaseRuntime(): Promise<CommunityRuntime | null> {
  const fb = await firebase();
  if (!fb) return null;
  return {
    kind: "firebase",
    db: firestoreDb(fb) as unknown as Db,
    assetsFor: (uid) => firebaseAssets(fb, uid),
    watchViewer: (next) => {
      let latest = 0;
      return watchFirebaseUser((user) => {
        const run = ++latest;
        if (!user) return next(null);
        void isOwnerUser(user).then((isOwner) => run === latest && next({ id: user.uid, isOwner }));
      });
    },
  };
}

/** The claude.ai artifact runtime when the site runs there, else Firebase when configured, else null. */
export function communityRuntime(): Promise<CommunityRuntime | null> {
  pending ??= (async () => {
    const inArtifact = typeof window !== "undefined" && typeof (window as ClaudeWindow).claude?.use === "function";
    if (inArtifact) return claudeRuntime();
    return firebaseAvailable() ? firebaseRuntime() : null;
  })();
  return pending;
}
