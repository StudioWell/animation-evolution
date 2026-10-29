"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/components/settings/useI18n";
import { SOURCES } from "@/lib/config/sources";

export function AboutView({ references, tutorials, live }: { references: number; tutorials: number; live: boolean }) {
  const { t, number } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
      <PageHeader title="about.title" className="mb-0" />
      <p className="ae-hero-line mt-5 text-[17px] leading-relaxed text-muted" style={{ ["--i" as string]: 1 }}>
        {t("about.lead")}
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat index={0} label={t("about.stat.references")} value={number(references)} />
        <Stat index={1} label={t("about.stat.tutorials")} value={number(tutorials)} />
        <Stat index={2} label={t("about.stat.live")} value={t(live ? "switch.on" : "switch.off")} />
      </dl>

      <div className="mt-14 flex flex-col gap-10 text-[15px] leading-relaxed text-muted">
        <Block title={t("about.sources.title")}>
          <p>
            {t("about.sources.p1", {
              sources: Object.values(SOURCES)
                .map((s) => s.label)
                .join(", "),
            })}
          </p>
          <p>{t("about.sources.p2")}</p>
        </Block>
        <Block title={t("about.links.title")}>
          <p>{t("about.links.p1")}</p>
          <p>{t("about.links.p2")}</p>
        </Block>
        <Block title={t("about.live.title")}>
          <p>{t("about.live.p")}</p>
        </Block>
        <Block title={t("about.yours.title")}>
          <p>
            {t("about.yours.before")}{" "}
            <Link href="/settings" className="ae-link-underline text-accent">
              {t("about.yours.link")}
            </Link>
            .
          </p>
        </Block>
      </div>
    </div>
  );
}

function Stat({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div className="ae-card-in ae-lift rounded-card border border-line bg-surface px-4 py-4" style={{ ["--i" as string]: index }}>
      <dt className="text-[13px] text-subtle">{label}</dt>
      <dd className="stretch-semi mt-1 text-2xl font-semibold text-fg tabular">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ae-reveal">
      <h2 className="stretch-semi text-lg font-semibold text-fg">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}
