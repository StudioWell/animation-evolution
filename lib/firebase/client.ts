/**
 * The Firebase web SDK, loaded on demand from Firebase's CDN (only when a
 * visitor signs in or opens community videos), plus small adapters that give
 * the rest of the site the same database/asset shape the claude.ai artifact
 * runtime has (see lib/community/runtime.ts).
 */
import { FIREBASE_CONFIG, FIREBASE_SDK, FIREBASE_UPLOADS, OWNER_EMAIL_SHA256, firebaseConfigured } from "@/lib/firebase/config";

/* ---------- The slice of the SDK this site uses ---------- */

export interface FirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}
type Unsubscribe = () => void;
interface RawSnap {
  id: string;
  exists(): boolean;
  data(): Record<string, unknown> | undefined;
}
interface AppModule {
  initializeApp(config: object): unknown;
}
interface AuthModule {
  getAuth(app: unknown): unknown;
  GoogleAuthProvider: new () => { setCustomParameters(p: Record<string, string>): void };
  signInWithPopup(auth: unknown, provider: unknown): Promise<{ user: FirebaseUser }>;
  signOut(auth: unknown): Promise<void>;
  onAuthStateChanged(auth: unknown, next: (user: FirebaseUser | null) => void): Unsubscribe;
}
interface FirestoreModule {
  getFirestore(app: unknown): unknown;
  doc(db: unknown, path: string): unknown;
  collection(db: unknown, path: string): unknown;
  getDoc(ref: unknown): Promise<RawSnap>;
  setDoc(ref: unknown, data: object): Promise<void>;
  updateDoc(ref: unknown, data: object): Promise<void>;
  deleteDoc(ref: unknown): Promise<void>;
  onSnapshot(ref: unknown, next: (snap: never) => void, error?: (e: unknown) => void): Unsubscribe;
}
interface StorageModule {
  getStorage(app: unknown): unknown;
  ref(storage: unknown, path: string): unknown;
  uploadBytes(ref: unknown, data: Blob, meta?: { contentType?: string }): Promise<{ metadata: { size: number; contentType?: string } }>;
  getDownloadURL(ref: unknown): Promise<string>;
  deleteObject(ref: unknown): Promise<void>;
}

export interface FirebaseServices {
  auth: unknown;
  db: unknown;
  storage: unknown | null;
  m: { auth: AuthModule; fs: FirestoreModule; st: StorageModule | null };
}

// A runtime URL, so bundlers leave it alone and the browser fetches the module.
const load = <T,>(name: string): Promise<T> => import(/* webpackIgnore: true */ /* @vite-ignore */ `${FIREBASE_SDK}/firebase-${name}.js`) as Promise<T>;

let services: Promise<FirebaseServices | null> | null = null;

/** Firebase, ready to use — or null when it isn't configured or can't load (offline, blocked). */
export function firebase(): Promise<FirebaseServices | null> {
  if (typeof window === "undefined" || !firebaseConfigured(FIREBASE_CONFIG)) return Promise.resolve(null);
  // Inside a claude.ai artifact the site uses that runtime instead.
  if (typeof (window as Window & { claude?: { use?: unknown } }).claude?.use === "function") return Promise.resolve(null);
  const config = FIREBASE_CONFIG;
  services ??= (async () => {
    try {
      const [app, auth, fs, st] = await Promise.all([
        load<AppModule>("app"),
        load<AuthModule>("auth"),
        load<FirestoreModule>("firestore"),
        FIREBASE_UPLOADS && config.storageBucket ? load<StorageModule>("storage") : Promise.resolve(null),
      ]);
      const instance = app.initializeApp(config);
      return {
        auth: auth.getAuth(instance),
        db: fs.getFirestore(instance),
        storage: st ? st.getStorage(instance) : null,
        m: { auth, fs, st },
      };
    } catch {
      services = null;
      return null;
    }
  })();
  return services;
}

export function firebaseAvailable(): boolean {
  return typeof window !== "undefined" && firebaseConfigured(FIREBASE_CONFIG) && typeof (window as Window & { claude?: { use?: unknown } }).claude?.use !== "function";
}

/* ---------- Auth ---------- */

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  const fb = await firebase();
  if (!fb) return null;
  const provider = new fb.m.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await fb.m.auth.signInWithPopup(fb.auth, provider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  const fb = await firebase();
  if (fb) await fb.m.auth.signOut(fb.auth).catch(() => undefined);
}

/** Calls back with the signed-in user (or null) now and on every change. */
export function watchFirebaseUser(next: (user: FirebaseUser | null) => void): Unsubscribe {
  let stop: Unsubscribe | null = null;
  let cancelled = false;
  void firebase().then((fb) => {
    if (cancelled) return;
    if (!fb) return next(null);
    stop = fb.m.auth.onAuthStateChanged(fb.auth, next);
  });
  return () => {
    cancelled = true;
    stop?.();
  };
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True for the site owner's verified Google account. */
export async function isOwnerUser(user: FirebaseUser | null): Promise<boolean> {
  if (!user?.email || !user.emailVerified) return false;
  return (await sha256(user.email.trim().toLowerCase())) === OWNER_EMAIL_SHA256;
}

/* ---------- Database adapter (same shape as the artifact `db`) ---------- */

/**
 * The artifact database merges nested objects on update; Firestore replaces a
 * map field unless the update names each leaf as a dotted path. Flatten so
 * `{items: {id: {status}}}` only touches `items.id.status`.
 */
export function toFieldPaths(data: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) Object.assign(out, toFieldPaths(value as Record<string, unknown>, path));
    else out[path] = value;
  }
  return out;
}

const wrap = (s: RawSnap) => ({ id: s.id, exists: s.exists(), data: () => s.data() });

export function firestoreDb(fb: FirebaseServices) {
  const { fs } = fb.m;
  return {
    doc(path: string) {
      const ref = fs.doc(fb.db, path);
      return {
        get: async () => wrap(await fs.getDoc(ref)),
        set: (data: Record<string, unknown>) => fs.setDoc(ref, data),
        update: (data: Record<string, unknown>) => fs.updateDoc(ref, toFieldPaths(data)),
        delete: () => fs.deleteDoc(ref),
        onSnapshot: (next: (s: ReturnType<typeof wrap>) => void, error?: (e: unknown) => void) =>
          fs.onSnapshot(ref, ((s: RawSnap) => next(wrap(s))) as (s: never) => void, error),
      };
    },
    collection(path: string) {
      const ref = fs.collection(fb.db, path);
      return {
        onSnapshot: (next: (s: { docs: ReturnType<typeof wrap>[] }) => void, error?: (e: unknown) => void) =>
          fs.onSnapshot(ref, ((q: { docs: RawSnap[] }) => next({ docs: q.docs.map(wrap) })) as (s: never) => void, error),
      };
    },
  };
}

/* ---------- Video uploads (Cloud Storage, when enabled) ---------- */

export function firebaseAssets(fb: FirebaseServices, uid: string) {
  const st = fb.m.st;
  if (!st || !fb.storage) return null;
  const path = (id: string) => `videos/${uid}/${id}`;
  return {
    async upload(blob: Blob, options?: { type?: string }) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      const ref = st.ref(fb.storage, path(id));
      const contentType = options?.type ?? blob.type;
      const done = await st.uploadBytes(ref, blob, { contentType });
      return { id, url: await st.getDownloadURL(ref), sizeBytes: done.metadata.size, contentType };
    },
    delete: (id: string) => st.deleteObject(st.ref(fb.storage, path(id))),
  };
}
