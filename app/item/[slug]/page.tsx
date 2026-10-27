import { ItemView } from "@/components/ItemView";
import { LISTINGS } from "@/lib/mock/listings";

export function generateStaticParams() {
  return LISTINGS.filter((l) => l.status === "live").map((l) => ({ slug: l.slug }));
}

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ItemView slug={slug} />;
}
