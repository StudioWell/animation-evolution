"use client";

import { useId, type ReactNode } from "react";
import { LOCALE_INFO, LOCALES, type Locale } from "@/lib/i18n";
import { THEME_OPTIONS } from "@/lib/settings/schema";
import { useSettings } from "@/components/settings/SettingsProvider";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/** A short sample in each language, written in that language, so people recognise their own. */
const LANGUAGE_SAMPLE: Record<Locale, string> = {
  en: "Look for what you will be learning",
  ru: "Найдите то, чему будете учиться",
  ja: "これから学ぶものを探そう",
  zh: "寻找你将要学习的内容",
};

export function SettingsPanel() {
  const { settings, update, reset, storageMode, prefersReducedMotion } = useSettings();
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-12">
      <Group title={t("settings.appearance")} description={t("settings.appearance.desc")} index={0}>
        <fieldset>
          <legend className="text-[15px] font-medium text-fg">{t("settings.theme")}</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((theme) => {
              const checked = settings.theme === theme.id;
              const name = t(`theme.${theme.id}`);
              return (
                <label key={theme.id} className={cx("ae-choice group", checked && "is-checked")}>
                  <input
                    type="radio"
                    name="theme"
                    value={theme.id}
                    checked={checked}
                    onChange={() => update({ theme: theme.id }, { key: "toast.theme", vars: { name } })}
                    className="sr-only"
                  />
                  {/* Miniature of the theme: background, surface, text and accent */}
                  <span
                    aria-hidden="true"
                    className="flex h-16 overflow-hidden rounded-[0.7rem] ring-1 ring-line ring-inset transition-transform duration-300 ease-soft group-hover:scale-[1.02]"
                    style={{ background: theme.swatches[0] }}
                  >
                    <span className="m-2 flex flex-1 flex-col justify-center gap-1.5 rounded-md px-2.5" style={{ background: theme.swatches[1] }}>
                      <span className="h-1.5 w-3/4 rounded-full" style={{ background: theme.swatches[2] }} />
                      <span className="h-1.5 w-1/2 rounded-full" style={{ background: theme.swatches[3] }} />
                    </span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[15px] font-medium text-fg">{name}</span>
                    <Radio checked={checked} />
                  </span>
                  <span className="mt-1 text-[13px] text-muted">{t(`theme.${theme.id}.desc`)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Group>

      <Group title={t("settings.language")} description={t("settings.language.desc")} index={1}>
        <fieldset>
          <legend className="sr-only">{t("settings.language")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {LOCALES.map((locale) => {
              const checked = settings.language === locale;
              const info = LOCALE_INFO[locale];
              return (
                <label key={locale} lang={info.htmlLang} className={cx("ae-choice group", checked && "is-checked")}>
                  <input
                    type="radio"
                    name="language"
                    value={locale}
                    checked={checked}
                    onChange={() => update({ language: locale }, { key: "toast.language", vars: { name: info.native } })}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cx(
                          "grid h-8 min-w-10 place-items-center rounded-[0.6rem] px-2 text-[12px] font-semibold tracking-wide uppercase transition-colors duration-300",
                          checked ? "bg-accent text-accent-ink" : "bg-surface-3 text-muted",
                        )}
                      >
                        {locale}
                      </span>
                      <span className="text-[15px] font-medium text-fg">{info.native}</span>
                    </span>
                    <Radio checked={checked} />
                  </span>
                  <span className="mt-2.5 text-[13px] text-muted">{LANGUAGE_SAMPLE[locale]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Group>

      <Group title={t("settings.video")} description={t("settings.video.desc")} index={2}>
        <Toggle
          label={t("settings.timestamps")}
          description={t("settings.timestamps.desc")}
          checked={settings.showTimestamps}
          onChange={(value) => update({ showTimestamps: value }, { key: value ? "toast.tsOn" : "toast.tsOff" })}
        />
      </Group>

      <Group title={t("settings.motion")} description={t("settings.motion.desc")} index={3}>
        <Toggle
          label={t("settings.reduce")}
          description={t("settings.reduce.desc")}
          checked={settings.reduceMotion || prefersReducedMotion}
          disabled={prefersReducedMotion}
          onChange={(value) => update({ reduceMotion: value }, { key: value ? "toast.motionOn" : "toast.motionOff" })}
        />
        {prefersReducedMotion && (
          <p className="mt-3 flex items-start gap-2 text-[13px] text-subtle">
            <Icon name="info" size={15} className="mt-px shrink-0" />
            {t("settings.osReduced")}
          </p>
        )}
      </Group>

      <Group title={t("settings.reset")} description={t("settings.reset.desc")} index={4}>
        <button type="button" onClick={reset} className="ae-btn ae-btn-ghost">
          <Icon name="refresh" size={16} className="transition-transform duration-500 ease-soft group-hover:-rotate-180" />
          {t("settings.reset.button")}
        </button>
      </Group>

      <p className="flex items-start gap-2 border-t border-line pt-6 text-[13px] text-subtle">
        <Icon name="info" size={15} className="mt-px shrink-0" />
        {t(`settings.storage.${storageMode}`)}
      </p>
    </div>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid size-5 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-300 ease-spring",
        checked ? "scale-100 border-accent bg-accent text-accent-ink" : "scale-90 border-line-strong",
      )}
    >
      <Icon name="check" size={12} strokeWidth={3} className={cx("transition-opacity duration-200", checked ? "opacity-100" : "opacity-0")} />
    </span>
  );
}

function Group({ title, description, children, index }: { title: string; description: string; children: ReactNode; index: number }) {
  return (
    <section className="ae-stagger grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10" style={{ ["--i" as string]: index }}>
      <div>
        <h2 className="stretch-semi text-lg font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  const { t } = useI18n();
  return (
    <div className="flex items-start justify-between gap-6 rounded-card border border-line bg-surface p-4 transition-colors duration-300 hover:border-line-strong sm:p-5">
      <div>
        <label htmlFor={id} className="text-[15px] font-medium text-fg">
          {label}
        </label>
        <p id={`${id}-desc`} className="mt-1 max-w-[56ch] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-300 disabled:opacity-60",
          checked ? "border-accent bg-accent shadow-[0_0_0_4px_var(--ae-accent-soft)]" : "border-line-strong bg-surface-3",
        )}
      >
        <span className="sr-only">{checked ? t("switch.on") : t("switch.off")}</span>
        <span
          aria-hidden="true"
          className={cx(
            "size-5 rounded-full shadow-sm transition-transform duration-500 ease-spring",
            checked ? "translate-x-[1.45rem] bg-accent-ink" : "translate-x-1 bg-fg",
          )}
        />
      </button>
    </div>
  );
}
