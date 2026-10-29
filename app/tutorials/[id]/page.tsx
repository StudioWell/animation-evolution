import type { Metadata } from "next";
import { detailMetadata, renderDetail } from "@/components/resources/DetailRoute";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return detailMetadata("tutorial", id);
}

export default async function TutorialDetailPage({ params }: Props) {
  const { id } = await params;
  return renderDetail("tutorial", id);
}
