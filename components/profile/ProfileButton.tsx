"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/profile/Avatar";
import { useCommunity } from "@/components/community/CommunityProvider";
import { useProfile } from "@/components/profile/ProfileProvider";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/** Header shortcut to My Profile: the visitor's photo or initials once set up. */
export function ProfileButton() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { status, profile } = useProfile();
  const { unseen } = useCommunity();
  const active = pathname === "/profile";
  const base = profile ? `${t("header.profile")}: ${profile.name}` : t("header.profile");
  const label = unseen.length ? `${base} — ${t("notice.badge")}` : base;
  return (
    <Link
      href="/profile"
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cx(
        "relative mr-2 grid size-10 place-items-center rounded-full border transition-[border-color,color,transform] duration-200 hover:-translate-y-px",
        active ? "border-accent text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {status === "ready" && profile ? (
        <Avatar name={profile.name} photo={profile.photo} size={32} />
      ) : (
        <Icon name="user" size={18} />
      )}
      {unseen.length > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-accent ring-2 ring-bg" />}
    </Link>
  );
}
