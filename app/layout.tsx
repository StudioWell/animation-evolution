import type { Metadata, Viewport } from "next";
import { Archivo, Golos_Text } from "next/font/google";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { CommunityProvider } from "@/components/community/CommunityProvider";
import { DecisionToast } from "@/components/community/DecisionToast";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";
import { detectLocale, LOCALE_INFO, parseAcceptLanguage } from "@/lib/i18n/locales";
import { SETTINGS_INIT_SCRIPT } from "@/lib/settings/init-script";
import { COOKIE_NAME, DEFAULT_SETTINGS, parseSettingsCookie } from "@/lib/settings/schema";
import "./globals.css";

// Archivo's width axis drives the squash-and-stretch type treatment (Latin).
const archivo = Archivo({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
// Golos Text covers Cyrillic with a similar grotesque voice. Japanese and Chinese use the
// system's CJK faces (see --font-cjk in globals.css), so nothing heavy is downloaded.
const golos = Golos_Text({ subsets: ["cyrillic", "cyrillic-ext"], variable: "--font-cyrillic", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Animation Evolution",
    template: "%s | Animation Evolution",
  },
  description:
    "Find animation references, movement studies and video tutorials from trusted sources — searchable by movement, category and tool.",
  applicationName: "Animation Evolution",
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0908",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Render the visitor's saved language and theme on the first response (no flash, correct <html lang>).
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const browserLanguage = detectLocale(parseAcceptLanguage(headerList.get("accept-language")));
  const initial = parseSettingsCookie(cookieStore.get(COOKIE_NAME)?.value, browserLanguage) ?? {
    ...DEFAULT_SETTINGS,
    language: browserLanguage,
  };

  return (
    <html
      lang={LOCALE_INFO[initial.language].htmlLang}
      data-theme={initial.theme}
      data-timestamps={initial.showTimestamps ? "on" : "off"}
      data-motion={initial.reduceMotion ? "reduced" : "full"}
      className={`${archivo.variable} ${golos.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies saved settings before first paint (no theme flash). Static, first-party code only. */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: SETTINGS_INIT_SCRIPT }} />
      </head>
      <body>
        <SettingsProvider initial={initial}>
          <ProfileProvider>
            <CommunityProvider>
            <SkipLink />
            <SiteHeader />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <SiteFooter />
            <WelcomeGate />
            <DecisionToast />
            </CommunityProvider>
          </ProfileProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
