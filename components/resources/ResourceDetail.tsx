"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SOFTWARE_OPTIONS, labelFor } from "@/lib/config/filters";
import { sourceLabel } from "@/lib/config/sources";
import { creatorKey, formatDuration } from "@/lib/format";
import { libraryHref, libraryPath } from "@/lib/search/query-string";
import type { Resource } from "@/lib/types";
import { Carousel } from "@/components/home/Carousel";
import { Section } from "@/components/home/Section";
import { ExternalLink, externalHost } from "@/components/resources/ExternalLink";
import { SaveButton } from "@/components/profile/SaveButton";
import { AvailabilityNote, DifficultyMeter } from "@/components/resources/Meta";
import { ReferenceCard } from "@/components/resources/ReferenceCard";
import { Thumbnail } from "@/components/resources/Thumbnail";
import { TutorialCard } from "@/components/resources/TutorialCard";
import { CONTENT_TYPE_ICON } from "@/components/resources/VideoCard";
import { useI18n, type I18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";

function verificationText(i18n: I18n, resource: Resource): string | null {
  const v = resource.verification;
  if (!v) return null;
  const date = i18n.date(v.checkedAt) ?? v.checkedAt;
  if (v.method === "youtube-data-api") return i18n.t("verify.api", { date });
  if (v.method === "search-listing") return i18n.t("verify.listing", { source: sourceLabel(resource.source), date });
  return i18n.t("verify.page", { date });
}

/** Shared details layout for references and tutorials. */
export function ResourceDetail({
  resource,
  relatedReferences,
  relatedTutorials,
}: {
  resource: Resource;
  relatedReferences: Resource[];
  relatedTutorials: Resource[];
}) {
  const i18n = useI18n();
  const { t, cat, describe, accessNote, date, views: viewsLabel, tag } = i18n;
  const softwareName = (s: string) => (s === "any" ? t("sw.any") : labelFor(SOFTWARE_OPTIONS, s as (typeof SOFTWARE_OPTIONS)[number]["value"]));
  const kind = resource.kind;
  const host = externalHost(resource);
  const duration = formatDuration(resource.durationSeconds);
  const unavailable = resource.availability === "unavailable";
  const cta = t(`cta.${resource.format}`);
  const note = accessNote(resource);
  const verified = verificationText(i18n, resource);

  const facts: { label: string; value: ReactNode; className?: string }[] = [];
  facts.push({
    label: t(kind === "tutorial" ? "fact.creator" : "fact.channel"),
    value: resource.creator ? (
      <Link href={libraryHref("all", { creators: [creatorKey(resource.creator)] })} className="ae-link-underline hover:text-accent">
        {resource.creator}
      </Link>
    ) : (
      <span className="text-subtle">{t("fact.channelUnconfirmed")}</span>
    ),
  });
  facts.push({ label: t("fact.platform"), value: sourceLabel(resource.source) });
  facts.push({
    label: t("fact.type"),
    value: (
      <Link href={libraryHref("all", { types: [resource.contentType] })} className="ae-link-underline hover:text-accent">
        {t(`ctype.${resource.contentType}`)}
      </Link>
    ),
  });
  if (resource.media.length) {
    facts.push({ label: t("fact.media"), value: resource.media.map((m) => t(`media.${m}`)).join(", ") });
  }
  if (resource.works?.length) facts.push({ label: t("fact.works"), value: resource.works.join(", ") });
  if (resource.format === "video" || duration) {
    facts.push({
      label: t("fact.duration"),
      value: duration ? <span className="tabular">{duration}</span> : <span className="text-subtle">{t("fact.durationUnknown")}</span>,
      className: "ae-duration",
    });
  }
  if (resource.publishedAt) facts.push({ label: t("fact.published"), value: date(resource.publishedAt) });
  if (resource.format !== "video") facts.push({ label: t("fact.format"), value: t(`format.${resource.format}`) });
  if (resource.difficulty) facts.push({ label: t("fact.level"), value: <DifficultyMeter level={resource.difficulty} /> });
  facts.push({ label: t("fact.software"), value: resource.software.map(softwareName).join(", ") });
  if (resource.techniques.length) {
    facts.push({ label: t("fact.techniques"), value: resource.techniques.map((x) => t(`tech.${x}`)).join(", ") });
  }
  if (resource.movements.length) {
    facts.push({ label: t("fact.movements"), value: resource.movements.map((x) => t(`move.${x}`)).join(", ") });
  }
  const views = viewsLabel(resource.viewCount);
  if (views) facts.push({ label: t("fact.views"), value: views });

  return (
    <article className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label={t("detail.breadcrumb")} className="ae-hero-line mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={libraryPath(kind)} className="ae-link-underline hover:text-fg">
              {t(`lib.${kind}.title`)}
            </Link>
          </li>
          {resource.categories[0] && (
            <>
              <li aria-hidden="true" className="text-subtle">
                /
              </li>
              <li>
                <Link href={libraryHref(kind, { categories: [resource.categories[0]] })} className="ae-link-underline hover:text-fg">
                  {cat(resource.categories[0])}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
        <div className="ae-hero-line" style={{ ["--i" as string]: 1 }}>
          <ExternalLink resource={resource} ariaLabel={`${cta}: ${resource.title}`} className="group block rounded-thumb">
            <div className="ae-detail-media relative">
              <Thumbnail resource={resource} priority showPlay={false} sizes="(min-width: 1024px) 60vw, 100vw" />
              {!unavailable && (
                <>
                  {resource.format === "video" && (
                    <span aria-hidden="true" className="ae-play ae-play-lg">
                      <Icon name="play" size={28} className="translate-x-0.5" />
                    </span>
                  )}
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                    <Icon name="external" size={14} />
                    {host}
                  </span>
                </>
              )}
            </div>
          </ExternalLink>
        </div>

        <div className="ae-hero-line min-w-0" style={{ ["--i" as string]: 2 }}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Icon name={CONTENT_TYPE_ICON[resource.contentType]} size={15} />
              {t(`ctype1.${resource.contentType}`)}
            </span>
            {resource.origin === "live" && <span className="ae-tag">{t("detail.live")}</span>}
            <AvailabilityNote resource={resource} />
          </div>
          <h1 className="stretch-semi mt-2 text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-balance text-fg">
            {resource.title}
          </h1>
          <section aria-labelledby="value-heading" className="mt-5 rounded-control border border-line bg-surface p-4">
            <h2 id="value-heading" className="text-[13px] font-medium tracking-wide text-accent">
              {t("detail.value")}
            </h2>
            <p className="mt-1.5 max-w-[62ch] text-[15px] leading-relaxed text-fg/90">{describe(resource)}</p>
          </section>

          <div className="mt-6 flex flex-col items-start gap-2.5">
            {unavailable ? (
              <p className="rounded-control border border-line bg-surface px-4 py-3 text-sm text-muted">
                {t("detail.unavailable", { source: sourceLabel(resource.source) })}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2.5">
                  <ExternalLink resource={resource} className="ae-btn ae-btn-primary ae-btn-lg group">
                    <Icon
                      name={resource.format === "video" ? "play" : "external"}
                      size={18}
                      className="transition-transform duration-300 ease-spring group-hover:scale-110"
                    />
                    {cta}
                  </ExternalLink>
                  <SaveButton resource={resource} variant="button" />
                </div>
                <p className="flex items-center gap-1.5 text-[13px] text-subtle">
                  <Icon name="external" size={14} />
                  {t("detail.leaving", { host })}
                </p>
              </>
            )}
          </div>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-line pt-6 text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className={`contents ${fact.className ?? ""}`}>
                <dt className="text-subtle">{fact.label}</dt>
                <dd className="min-w-0 text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {note && (
            <p className="mt-5 flex items-start gap-2 rounded-control bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-muted">
              <Icon name="info" size={15} className="mt-0.5 shrink-0 text-accent" />
              {note}
            </p>
          )}

          <div className="mt-6">
            <h2 className="text-sm text-subtle">{t("detail.categories")}</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {resource.categories.map((slug) => (
                <li key={slug}>
                  <Link href={libraryHref("all", { categories: [slug] })} className="ae-tag-link">
                    {cat(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {resource.tags.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm text-subtle">{t("detail.tags")}</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {resource.tags.map((name) => (
                  <li key={name}>
                    <Link href={libraryHref("all", { q: name })} className="ae-chip text-[13px]">
                      {tag(name)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verified && (
            <p className="mt-8 text-xs leading-relaxed text-subtle">
              {verified} {t("verify.rights", { source: sourceLabel(resource.source) })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-16">
        {relatedReferences.length > 0 && (
          <Section
            id="related-references"
            title={t("related.references")}
            viewAllHref={libraryHref("reference", { categories: resource.categories.slice(0, 1) })}
          >
            <Carousel label={t("related.references")}>
              {relatedReferences.map((r) => (
                <ReferenceCard key={r.id} resource={r} />
              ))}
            </Carousel>
          </Section>
        )}
        {relatedTutorials.length > 0 && (
          <Section
            id="related-tutorials"
            title={t("related.tutorials")}
            viewAllHref={libraryHref("tutorial", { categories: resource.categories.slice(0, 1) })}
          >
            <Carousel label={t("related.tutorials")}>
              {relatedTutorials.map((r) => (
                <TutorialCard key={r.id} resource={r} />
              ))}
            </Carousel>
          </Section>
        )}
      </div>
    </article>
  );
}
