"use client";

import Link from "next/link";
import { useI18n } from "@/components/settings/useI18n";
import { BrandMark } from "@/components/layout/BrandMark";

export function SiteFooter() {
  const { t } = useI18n();
  const links = [
    { href: "/library", label: t("header.library") },
    { href: "/references", label: t("header.references") },
    { href: "/tutorials", label: t("header.tutorials") },
    { href: "/categories", label: t("header.categories") },
    { href: "/settings", label: t("nav.settings") },
    { href: "/about", label: t("footer.about") },
  ];
  return (
    <footer className="mt-28 border-t border-line bg-band">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 text-sm text-muted sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="max-w-md">
          <p className="flex items-center gap-2.5 font-medium text-fg">
            <BrandMark className="size-6" />
            Animation Evolution
          </p>
          <p className="mt-3 leading-relaxed">{t("footer.blurb")}</p>
        </div>
        <nav aria-label={t("footer.nav")}>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link className="ae-link-underline hover:text-fg" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
