import ShopHero from "@/app/shop/components/ShopHero";
import CollectionWall from "@/components/CollectionWall";
import type { ArchiveTotals, CategoryRow } from "@/lib/collections";

export default function ShopRoom({
  categories,
  totals,
}: {
  categories: CategoryRow[] | null;
  totals: ArchiveTotals;
}) {
  return (
    <>
      <ShopHero totals={totals} />

      <section className="shop-room is-dark-room">
        {categories === null ? (
          <p className="shop-room-empty">
            The archive did not load. Reload the page — if it keeps failing,
            write to info@patoturri.com and we will sort it out.
          </p>
        ) : categories.length === 0 ? (
          <p className="shop-room-empty">
            No collections are published yet. New work goes up here first.
          </p>
        ) : (
          <CollectionWall categories={categories} />
        )}
      </section>
    </>
  );
}
