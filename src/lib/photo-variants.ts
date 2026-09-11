import type { PoolClient } from "pg";

/**
 * Lista de precios del catálogo. Es la misma para toda fotografía: el cliente
 * elige el tamaño en la ficha, el administrador no lo carga. Vive acá, del lado
 * del servidor, para que el precio nunca dependa de lo que mande el navegador.
 */
export const CATALOG_SIZES = [
  { size: "A4", price: 40 },
  { size: "A3", price: 55 },
  { size: "A2", price: 70 },
] as const;

export type NormalizedVariant = {
  size: string;
  price: number;
  stock: number;
};

/**
 * Construye el juego de variantes de una fotografía a partir de la lista de
 * precios del catálogo. El stock es el de la obra: si hay 10 copias, hay 10 en
 * cada tamaño, porque se imprime por pedido y no hay inventario por medida.
 */
export function catalogVariants(stock: number): NormalizedVariant[] {
  return CATALOG_SIZES.map(({ size, price }) => ({ size, price, stock }));
}

/**
 * Reemplaza el juego de variantes de una fotografía dentro de una transacción
 * ya abierta. Actualiza las que ya existen y borra las que sobren — en vez de
 * borrar todo y reinsertar, para no perder los ids que ya circulan en pedidos.
 */
export async function replaceVariants(
  client: PoolClient,
  photoId: number,
  variants: NormalizedVariant[],
) {
  for (const variant of variants) {
    await client.query(
      `INSERT INTO photo_variants (photo_id, size, price, stock)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (photo_id, size)
       DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock`,
      [photoId, variant.size, variant.price, variant.stock],
    );
  }

  const keptSizes = variants.map((variant) => variant.size);
  await client.query(
    `DELETE FROM photo_variants
     WHERE photo_id = $1 AND NOT (size = ANY($2::varchar[]))`,
    [photoId, keptSizes],
  );
}

/**
 * Subconsulta reutilizable que adjunta las variantes a una fila de `photos`.
 * Ordena por precio para que la ficha muestre siempre A4 → A3 → A2.
 */
export const VARIANTS_SUBQUERY = `
  COALESCE((
    SELECT json_agg(
             json_build_object(
               'id', v.id,
               'size', v.size,
               'price', v.price,
               'currency', v.currency,
               'stock', v.stock
             ) ORDER BY v.price ASC
           )
    FROM photo_variants v
    WHERE v.photo_id = p.id
  ), '[]'::json) AS variants`;
