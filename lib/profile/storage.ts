/**
 * Where a visitor's profile lives. Everything is client-side:
 *  - this browser's localStorage, always (works on any static host);
 *  - when the site runs as a claude.ai artifact, also the viewer's private
 *    `data/users/<id>/profile` document, so the profile follows their account.
 * Every value read back is validated; anything malformed is ignored.
 */

export type Provider = "google" | "claude" | "device";

export interface Account {
  provider: Provider;
  /** Google `sub`, claude.ai user id, or a random device id. */
  id: string;
  email: string | null;
  /** Name offered by the sign-in provider, used to pre-fill setup. */
  suggestedName: string;
}

export interface ProfileData {
  name: string;
  /** Square JPEG data URL (256px), or null for initials. */
  photo: string | null;
  /** Saved resource ids, newest first. */
  saved: string[];
  updatedAt: string;
}

export const NAME_MAX = 40;
export const SAVED_MAX = 200;
const PHOTO_MAX = 180_000;
const ACCOUNT_KEY = "ae:account";
const PROFILE_PREFIX = "ae:profile:";
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const PHOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export function cleanName(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";
}

export function parseAccount(raw: unknown): Account | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  if (a.provider !== "google" && a.provider !== "claude" && a.provider !== "device") return null;
  if (typeof a.id !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(a.id)) return null;
  return {
    provider: a.provider,
    id: a.id,
    email: typeof a.email === "string" ? a.email.slice(0, 254) : null,
    suggestedName: cleanName(a.suggestedName),
  };
}

export function parseProfile(raw: unknown): ProfileData | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const name = cleanName(p.name);
  if (!name) return null;
  const photo = typeof p.photo === "string" && p.photo.length <= PHOTO_MAX && PHOTO.test(p.photo) ? p.photo : null;
  const saved = Array.isArray(p.saved) ? [...new Set(p.saved.filter((id): id is string => typeof id === "string" && ID.test(id)))].slice(0, SAVED_MAX) : [];
  const updatedAt = typeof p.updatedAt === "string" && !Number.isNaN(Date.parse(p.updatedAt)) ? p.updatedAt : new Date(0).toISOString();
  return { name, photo, saved, updatedAt };
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the profile still works for this visit.
  }
}

const profileKey = (account: Account) => `${PROFILE_PREFIX}${account.provider}:${account.id}`;

export const local = {
  account: (): Account | null => parseAccount(read(ACCOUNT_KEY)),
  setAccount: (account: Account | null) => write(ACCOUNT_KEY, account),
  profile: (account: Account): ProfileData | null => parseProfile(read(profileKey(account))),
  setProfile: (account: Account, profile: ProfileData) => write(profileKey(account), profile),
  /** Keys whose change in another tab should refresh this one. */
  watches: (key: string | null) => key === null || key === ACCOUNT_KEY || key.startsWith(PROFILE_PREFIX),
};

export function newDeviceId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- claude.ai artifact runtime (only present when the site runs there) ----------

interface ClaudeViewer {
  id: string | null;
  name: string;
}
interface ClaudeUser {
  me(): Promise<ClaudeViewer>;
}
interface ClaudeDoc {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
}
interface ClaudeDb {
  doc(path: string): ClaudeDoc;
}
type ClaudeWindow = Window & { claude?: { use?: (name: string) => Promise<unknown> } };

function capability<T>(name: string, timeoutMs = 4000): Promise<T | null> {
  const use = (window as ClaudeWindow).claude?.use;
  if (typeof use !== "function") return Promise.resolve(null);
  return Promise.race([
    Promise.resolve(use.call((window as ClaudeWindow).claude, name)).then((v) => (v ?? null) as T | null, () => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

/** The signed-in claude.ai viewer, when this page runs as an artifact that may know them. */
export async function claudeViewer(): Promise<{ id: string; name: string } | null> {
  const user = await capability<ClaudeUser>("user");
  if (!user) return null;
  try {
    const me = await user.me();
    return me.id ? { id: me.id, name: cleanName(me.name) } : null;
  } catch {
    return null;
  }
}

const remotePath = (account: Account) => `data/users/${account.id}/profile`;

export const remote = {
  async load(account: Account): Promise<ProfileData | null> {
    if (account.provider !== "claude") return null;
    const db = await capability<ClaudeDb>("db");
    if (!db) return null;
    try {
      const snap = await db.doc(remotePath(account)).get();
      return snap.exists ? parseProfile(snap.data()) : null;
    } catch {
      return null;
    }
  },
  /** Resolves true when the account copy was written. */
  async save(account: Account, profile: ProfileData): Promise<boolean> {
    if (account.provider !== "claude") return false;
    const db = await capability<ClaudeDb>("db");
    if (!db) return false;
    try {
      await db.doc(remotePath(account)).set({ ...profile });
      return true;
    } catch {
      return false;
    }
  },
};

/** Center-crop an image file to a square JPEG data URL. Rejects anything that isn't a decodable image. */
export function photoFromFile(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type) || file.size > 10 * 1024 * 1024) return reject(new Error("type"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        if (!side) return reject(new Error("decode"));
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
