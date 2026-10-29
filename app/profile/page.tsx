import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Sign in to save animation references and tutorials, and manage your name and photo.",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
