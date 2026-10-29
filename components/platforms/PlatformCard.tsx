"use client";

import Link from "next/link";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import type { Platform } from "@/lib/config/platforms";
import type { MessageKey } from "@/lib/i18n";
import { cx } from "@/lib/format";

export function PlatformMonogram({ platform, size = 52, className }: { platform: Platform; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("grid shrink-0 place-items-center rounded-[28%] font-semibold tracking-[-0.03em] ring-1 ring-white/10", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(145deg, hsl(${platform.hue} 32% 30%), hsl(${platform.hue} 28% 18%))`,
        color: `hsl(${platform.hue} 55% 86%)`,
      }}
    >
      {platform.monogram}
    </span>
  );
}

/** One platform: monogram, name, what you can learn and how many tutorials there are. */
export function PlatformCard({ platform, count, index = 0 }: { platform: Platform; count: number; index?: number }) {
  const { t, plural } = useI18n();
  return (
    <Link
      href={`/platforms/${platform.slug}`}
      aria-label={t("platforms.open", { name: platform.name })}
      className="ae-reveal group relative flex flex-col gap-4 rounded-[1.25rem] border border-line bg-surface p-5 transition-[border-color,transform,background-color] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2"
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-center gap-4">
        <PlatformMonogram platform={platform} />
        <div className="min-w-0">
          <p className="stretch-semi text-lg font-semibold tracking-[-0.01em] text-fg">{platform.name}</p>
          <p className="text-[13px] text-accent tabular">{plural("platforms.tutorials", count)}</p>
        </div>
        <Icon name="arrowRight" size={18} className="ml-auto shrink-0 text-subtle transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <p className="text-[14px] leading-relaxed text-muted">{t(`platform.${platform.slug}.desc` as MessageKey)}</p>
    </Link>
  );
}

export function PlatformGrid({ platforms, counts, className }: { platforms: Platform[]; counts: Record<string, number>; className?: string }) {
  return (
    <div className={cx("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {platforms.map((p, i) => (
        <PlatformCard key={p.slug} platform={p} count={counts[p.slug] ?? 0} index={i} />
      ))}
    </div>
  );
}
