"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useProfile } from "@/components/profile/ProfileProvider";
import {
  isUnseenDecision,
  LIMITS,
  newSubmissionId,
  parseAuthorDoc,
  parseSubmission,
  parseVideoLink,
  VIDEO_TYPES,
  type GenreSlug,
  type PlatformChoice,
  type Submission,
  type SubmissionVideo,
} from "@/lib/community/model";
import { communityRuntime, type CommunityRuntime, type Viewer } from "@/lib/community/runtime";

export interface SubmissionInput {
  title: string;
  description: string;
  kind: "reference" | "tutorial";
  platform: PlatformChoice;
  genres: GenreSlug[];
  file: File | null;
  link: string;
}

export type SubmitError = "not-signed-in" | "invalid" | "file-type" | "file-size" | "no-upload" | "upload" | "save";

interface CommunityContextValue {
  /** "unavailable": no shared database here (static hosting, signed-out visitor). */
  status: "loading" | "unavailable" | "ready";
  isOwner: boolean;
  canUpload: boolean;
  /** Signed in with the account the database knows (a claude.ai account in the artifact). */
  canSubmit: boolean;
  mine: Submission[];
  published: Submission[];
  /** Every submission from every author — only for the site owner. */
  all: Submission[];
  unseen: Submission[];
  submit: (input: SubmissionInput, onStage?: (stage: "uploading" | "saving") => void) => Promise<SubmitError | null>;
  markSeen: (id: string) => Promise<void>;
  withdraw: (id: string) => Promise<void>;
  approve: (s: Submission) => Promise<boolean>;
  reject: (s: Submission, reason: string) => Promise<boolean>;
}

const CommunityContext = createContext<CommunityContextValue | null>(null);
const now = () => new Date().toISOString();

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { status: profileStatus, account, profile } = useProfile();
  const [runtime, setRuntime] = useState<CommunityRuntime | null | undefined>(undefined);
  const [mine, setMine] = useState<Submission[]>([]);
  const [published, setPublished] = useState<Submission[]>([]);
  const [all, setAll] = useState<Submission[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const writing = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let alive = true;
    communityRuntime().then((r) => alive && setRuntime(r));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!runtime) return setViewer(null);
    return runtime.watchViewer(setViewer);
  }, [runtime]);

  const viewerId = viewer?.id ?? null;
  const isOwner = Boolean(viewer?.isOwner);
  const assets = useMemo(() => (runtime && viewerId ? runtime.assetsFor(viewerId) : null), [runtime, viewerId]);
  // Signed in on the site with the same account the database knows: claude.ai in the artifact, Google on the public site.
  const provider = runtime?.kind === "claude" ? "claude" : "google";
  const canSubmit = Boolean(runtime && viewerId && profileStatus === "ready" && account?.provider === provider && account.id === viewerId);

  // Approved videos: everyone who can open the site reads them.
  useEffect(() => {
    if (!runtime) return;
    return runtime.db.collection("published").onSnapshot(
      (snap) =>
        setPublished(
          snap.docs
            .map((d) => {
              const data = d.data();
              return parseSubmission(data, d.id, typeof data?.authorId === "string" ? data.authorId : "");
            })
            .filter((s): s is Submission => Boolean(s))
            .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? "")),
        ),
      () => setPublished([]),
    );
  }, [runtime]);

  // The viewer's own submissions (their status, the reviewer's reason).
  useEffect(() => {
    if (!runtime || !viewerId) return setMine([]);
    return runtime.db.doc(`submissions/${viewerId}`).onSnapshot(
      (snap) => setMine(snap.exists ? parseAuthorDoc(snap.data(), viewerId) : []),
      () => setMine([]),
    );
  }, [runtime, viewerId]);

  // The review queue — the owner reads every author's document.
  useEffect(() => {
    if (!runtime || !isOwner) return setAll([]);
    return runtime.db.collection("submissions").onSnapshot(
      (snap) => setAll(snap.docs.flatMap((d) => parseAuthorDoc(d.data(), d.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      () => setAll([]),
    );
  }, [runtime, isOwner]);

  /** One write at a time per document. */
  const queue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = writing.current.then(task, task);
    writing.current = next.catch(() => undefined);
    return next;
  }, []);

  const writeItem = useCallback(
    (authorId: string, id: string, fields: Record<string, unknown>, create = false) =>
      queue(async () => {
        if (!runtime) throw new Error("unavailable");
        const ref = runtime.db.doc(`submissions/${authorId}`);
        if (create) {
          const snap = await ref.get();
          if (!snap.exists) return ref.set({ items: { [id]: fields } });
        }
        return ref.update({ items: { [id]: fields } });
      }),
    [queue, runtime],
  );

  const submit = useCallback<CommunityContextValue["submit"]>(
    async (input, onStage) => {
      if (!runtime || !canSubmit || !viewerId || !profile) return "not-signed-in";
      const title = input.title.trim();
      if (!title || input.genres.length === 0) return "invalid";
      let video: SubmissionVideo;
      if (input.file) {
        if (!assets) return "no-upload";
        const type = input.file.type;
        if (!VIDEO_TYPES.includes(type as (typeof VIDEO_TYPES)[number])) return "file-type";
        if (input.file.size > LIMITS.uploadBytes) return "file-size";
        onStage?.("uploading");
        try {
          const up = await assets.upload(input.file, { type });
          video = { type: "upload", assetId: up.id, contentType: type, size: up.sizeBytes };
          if (runtime.kind === "firebase") video.url = up.url;
        } catch {
          return "upload";
        }
      } else {
        const url = parseVideoLink(input.link);
        if (!url) return "invalid";
        video = { type: "link", url };
      }
      const id = newSubmissionId();
      const record = {
        authorId: viewerId,
        authorName: profile.name,
        title: title.slice(0, LIMITS.title),
        description: input.description.trim().slice(0, LIMITS.description),
        kind: input.kind,
        platform: input.platform,
        genres: input.genres.slice(0, LIMITS.genres),
        video,
        status: "pending",
        reason: "",
        createdAt: now(),
        reviewedAt: null,
        seenAt: null,
      };
      onStage?.("saving");
      try {
        await writeItem(viewerId, id, record, true);
        return null;
      } catch {
        return "save";
      }
    },
    [runtime, assets, canSubmit, viewerId, profile, writeItem],
  );

  const markSeen = useCallback(
    async (id: string) => {
      if (!viewerId) return;
      await writeItem(viewerId, id, { seenAt: now() }).catch(() => undefined);
    },
    [viewerId, writeItem],
  );

  const withdraw = useCallback(
    async (id: string) => {
      if (!runtime || !viewerId) return;
      const item = mine.find((s) => s.id === id);
      await queue(async () => {
        const ref = runtime.db.doc(`submissions/${viewerId}`);
        const snap = await ref.get();
        const items = { ...((snap.data()?.items as Record<string, unknown>) ?? {}) };
        delete items[id];
        await ref.set({ items });
      }).catch(() => undefined);
      if (item?.video.type === "upload") await assets?.delete(item.video.assetId).catch(() => undefined);
    },
    [runtime, assets, viewerId, mine, queue],
  );

  const approve = useCallback(
    async (s: Submission) => {
      if (!runtime || !isOwner) return false;
      const reviewedAt = now();
      try {
        const { id, ...body } = s;
        await runtime.db.doc(`published/${id}`).set({ ...body, status: "approved", reason: "", reviewedAt, seenAt: null });
        await writeItem(s.authorId, s.id, { status: "approved", reason: "", reviewedAt });
        return true;
      } catch {
        return false;
      }
    },
    [runtime, isOwner, writeItem],
  );

  const reject = useCallback(
    async (s: Submission, reason: string) => {
      const why = reason.trim().slice(0, LIMITS.reason);
      if (!runtime || !isOwner || !why) return false;
      try {
        await writeItem(s.authorId, s.id, { status: "rejected", reason: why, reviewedAt: now() });
        await runtime.db.doc(`published/${s.id}`).delete();
        return true;
      } catch {
        return false;
      }
    },
    [runtime, isOwner, writeItem],
  );

  const value = useMemo<CommunityContextValue>(
    () => ({
      status: runtime === undefined ? "loading" : runtime ? "ready" : "unavailable",
      isOwner,
      canUpload: Boolean(assets),
      canSubmit,
      mine,
      published,
      all,
      unseen: mine.filter(isUnseenDecision),
      submit,
      markSeen,
      withdraw,
      approve,
      reject,
    }),
    [runtime, isOwner, assets, canSubmit, mine, published, all, submit, markSeen, withdraw, approve, reject],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity(): CommunityContextValue {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used inside <CommunityProvider>");
  return ctx;
}
