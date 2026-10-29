import type { Metadata } from "next";
import { CommunityView } from "@/components/community/CommunityView";

export const metadata: Metadata = {
  title: "Community videos",
  description: "Reference and tutorial videos shared by animators and reviewed by the site owner.",
};

export default function CommunityPage() {
  return <CommunityView />;
}
