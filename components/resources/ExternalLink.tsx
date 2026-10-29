"use client";

import type { ReactNode } from "react";
import { SOURCES } from "@/lib/config/sources";
import { isAllowedSourceUrl } from "@/lib/security/url";
import type { Resource } from "@/lib/types";
import { useI18n } from "@/components/settings/useI18n";
import { cx } from "@/lib/format";

/**
 * The only component that renders links to other sites. It re-validates the URL
 * against the source allowlist at render time and always opens a new tab with
 * rel="noopener noreferrer", announcing that the user is leaving the site.
 */
export function ExternalLink({
  resource,
  children,
  className,
  ariaLabel,
}: {
  resource: Resource;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const { t } = useI18n();
  const host = externalHost(resource);
  if (!isAllowedSourceUrl(resource.url, resource.source) || resource.availability === "unavailable") {
    return (
      <span className={cx(className, "cursor-not-allowed opacity-60")} aria-disabled="true">
        {children}
      </span>
    );
  }
  const notice = t("ext.opens", { host });
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="strict-origin-when-cross-origin"
      className={className}
      aria-label={ariaLabel ? `${ariaLabel} ${notice}` : undefined}
    >
      {children}
      {!ariaLabel && <span className="sr-only"> {notice}</span>}
    </a>
  );
}

export function externalHost(resource: Resource): string {
  return SOURCES[resource.source]?.displayHost ?? "external site";
}
