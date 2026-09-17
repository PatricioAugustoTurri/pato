import type { Metadata } from "next";
import { pool } from "@/lib/db";
import ShopRoom from "@/app/shop/components/ShopRoom";
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

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  descripcion?: string | null;
  images?: unknown;
  obras: number;
  paises: number;
};

export type ArchiveTotals = {
  obras: number;
  paises: number;
  colecciones: number;
};

/* La cantidad de obras de cada coleccion no es un dato al margen: es lo que
   decide el ancho de su panel. Por eso se cuenta acá y no en el cliente. */
async function getCategories(): Promise<CategoryRow[] | null> {
  try {
    const { rows } = await pool.query<CategoryRow>(`
      SELECT c.id, c.name, c.slug, c.descripcion, c.images,
             count(p.id)::int              AS obras,
             count(DISTINCT p.pais)::int   AS paises
      FROM categories c
      LEFT JOIN photos p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug, c.descripcion, c.images
      ORDER BY c.id ASC
      LIMIT 4
    `);

    return rows;
  } catch {
    /* null = no pudimos preguntar. [] = preguntamos y no hay nada. La interfaz
       las dice distinto porque el visitante puede resolver una y no la otra. */
    return null;
  }
}

async function getTotals(): Promise<ArchiveTotals> {
  try {
    const { rows } = await pool.query<ArchiveTotals>(`
      SELECT count(*)::int                                        AS obras,
             count(DISTINCT pais)::int                            AS paises,
             (SELECT count(*)::int FROM categories)               AS colecciones
      FROM photos
    `);

    return rows[0] ?? { obras: 0, paises: 0, colecciones: 0 };
  } catch {
    return { obras: 0, paises: 0, colecciones: 0 };
  }
}

export default async function ShopPage() {
  const [categories, totals] = await Promise.all([getCategories(), getTotals()]);

  return <ShopRoom categories={categories} totals={totals} />;
}
