import type { Metadata } from "next";
import { detailMetadata, renderDetail } from "@/components/resources/DetailRoute";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return detailMetadata("reference", id);
}

export default async function ReferenceDetailPage({ params }: Props) {
  const { id } = await params;
  return renderDetail("reference", id);
}
