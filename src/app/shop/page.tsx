import type { Metadata } from "next";
import ShopRoom from "@/app/shop/components/ShopRoom";
import { getArchiveTotals, getCollections } from "@/lib/collections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop",
  description:
    "Every collection in the archive: History, City, Landscape and Portrait, printed to order in A4, A3 and A2.",
  path: "/shop",
});

/* Las colecciones y sus cifras se editan desde el panel, no en un deploy, asi
   que esta portada se rehace sola cada hora en vez de quedar congelada en el
   recuento que hubiera al compilar. Misma cifra que la portada y que
   /destinations: las tres leen el mismo catalogo y no hay razon para que
   caduquen a ritmos distintos. */
export const revalidate = 3600;

export default async function ShopPage() {
  const [categories, totals] = await Promise.all([getCollections(), getArchiveTotals()]);

  return <ShopRoom categories={categories} totals={totals} />;
}
