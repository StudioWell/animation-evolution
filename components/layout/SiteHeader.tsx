import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { ReviewButton } from "@/components/community/ReviewDialog";
import { ProfileButton } from "@/components/profile/ProfileButton";
import { SiteMenu } from "@/components/layout/SiteMenu";

export { BrandMark };

export function SiteHeader() {
  return (
    <header className="ae-header sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group -ml-1 flex items-center gap-2.5 rounded-control px-1 py-1 text-fg">
          <BrandMark className="size-7" />
          <span className="stretch-semi text-[15px] font-semibold tracking-[-0.01em]">Animation Evolution</span>
        </Link>
        <HeaderNav />
        <div className="ml-auto flex items-center">
          <ReviewButton />
          <ProfileButton />
          <SiteMenu />
        </div>
      </div>
    </header>
  );
}
