import type { Resource } from "@/lib/types";
import { VideoCard, VideoCardSkeleton } from "@/components/resources/VideoCard";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function ResultsGrid({ items }: { items: Resource[] }) {
  return (
    <ul className={GRID}>
      {items.map((item, index) => (
        <li key={item.id} className="ae-card-in flex" style={{ ["--i" as string]: index % 12 }}>
          <VideoCard resource={item} priority={index < 4} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <ul className={GRID} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <VideoCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
