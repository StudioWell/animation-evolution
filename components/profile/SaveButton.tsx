"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProfile } from "@/components/profile/ProfileProvider";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";
import type { Resource } from "@/lib/types";

/**
 * Bookmark toggle that saves a video to the visitor's profile. Signed-out
 * visitors are taken to My Profile to sign in first.
 */
export function SaveButton({ resource, variant = "icon", className }: { resource: Resource; variant?: "icon" | "button"; className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { status, isSaved, toggleSave } = useProfile();
  const [bumped, setBumped] = useState(false);
  const saved = status === "ready" && isSaved(resource.id);
  // A stable name; aria-pressed carries the saved state.
  const label = status === "ready" ? t("save.add", { title: resource.title }) : t("save.signin");

  const onClick = () => {
    if (status !== "ready") {
      router.push("/profile");
      return;
    }
    toggleSave(resource.id);
    setBumped(true);
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        aria-label={label}
        title={status === "ready" ? undefined : label}
        onClick={onClick}
        className={cx("ae-save ae-btn ae-btn-ghost ae-btn-lg", bumped && "is-bumped", className)}
        onAnimationEnd={() => setBumped(false)}
      >
        <Icon name="bookmark" size={17} />
        {saved ? t("save.saved") : t("save.save")}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx("ae-save ae-icon-btn", bumped && "is-bumped", className)}
      onAnimationEnd={() => setBumped(false)}
    >
      <Icon name="bookmark" size={15} />
    </button>
  );
}
