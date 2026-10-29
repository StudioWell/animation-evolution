"use client";

import { initials } from "@/components/profile/ProfileProvider";
import { cx } from "@/lib/format";

/** Round profile photo, or the name's initials on a warm disc. */
export function Avatar({ name, photo, size = 40, className }: { name: string; photo: string | null; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-accent-strong ring-1 ring-line-strong", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local data: URL, nothing to optimise
        <img src={photo} alt="" width={size} height={size} className="size-full object-cover" />
      ) : (
        <span className="font-semibold tracking-[-0.02em]">{initials(name)}</span>
      )}
    </span>
  );
}
