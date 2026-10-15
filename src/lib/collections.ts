import { pool } from "@/lib/db";

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

/**
 * Las colecciones publicadas, con sus cifras.
 *
 * La lee la tienda, la portada y la página 404: el catálogo se navega por
 * colección (decisión del usuario, 2026-10-15), y las tres puertas tienen que
 * mostrar las mismas. Vivía dentro de `/shop/page.tsx`.
 *
 * Solo las que tienen obra. Una colección vacía era un panel que decía
 * "0 works" y llevaba a una sala sin nada colgado; la ruta sigue existiendo
 * —los enlaces viejos no se rompen— pero no se ofrece.
 *
 * La cantidad de obras de cada colección no es un dato al margen: es lo que
 * decide el ancho de su panel en la tienda. Por eso se cuenta acá y no en el
 * cliente.
 */
export async function getCollections(): Promise<CategoryRow[] | null> {
  try {
    const { rows } = await pool.query<CategoryRow>(`
      SELECT c.id, c.name, c.slug, c.descripcion, c.images,
             count(p.id)::int              AS obras,
             count(DISTINCT p.pais)::int   AS paises
      FROM categories c
      INNER JOIN photos p ON p.category_id = c.id
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

/** Las cifras del archivo entero, contando solo colecciones con obra. */
export async function getArchiveTotals(): Promise<ArchiveTotals> {
  try {
    const { rows } = await pool.query<ArchiveTotals>(`
      SELECT count(*)::int                    AS obras,
             count(DISTINCT pais)::int        AS paises,
             count(DISTINCT category_id)::int AS colecciones
      FROM photos
    `);

    return rows[0] ?? { obras: 0, paises: 0, colecciones: 0 };
  } catch {
    return { obras: 0, paises: 0, colecciones: 0 };
  }
}
