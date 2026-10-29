import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata: Metadata = {
  title: "Settings",
  description: "Choose a color theme and language, show or hide video timestamps, and reduce animations.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <PageHeader title="settings.title" intro="settings.intro" className="mb-12" />
      <SettingsPanel />
    </div>
  );
}
