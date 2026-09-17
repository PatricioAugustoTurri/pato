import type { Pool, PoolClient } from "pg";
import { pool } from "@/lib/db";

export type CatalogSize = {
  size: string;
  price: number;
};

/**
 * Lista de precios del catálogo. Es la misma para toda fotografía: el cliente
 * elige el tamaño en la ficha, el administrador no lo carga por obra.
 *
 * Vivía acá como constante y ahora vive en `catalog_sizes`, para que cambiar un
 * precio sea una fila y no un deploy. Lo que no cambió es de qué lado se lee:
 * del servidor, siempre, para que el precio nunca dependa de lo que mande el
 * navegador. `src/lib/money.ts` lo formatea; nadie lo recalcula.
 *
 * Acepta un cliente para poder leerse dentro de una transacción ya abierta —es
 * lo que hacen las rutas del panel al guardar una obra—, y cae en el pool
 * cuando se la llama suelta, como en la página de preguntas frecuentes.
 */
export async function catalogSizes(db: Pool | PoolClient = pool): Promise<CatalogSize[]> {
  const { rows } = await db.query<{ size: string; price: string }>(
    "SELECT size, price FROM catalog_sizes ORDER BY position ASC, id ASC",
  );

  /* `numeric` llega de `pg` como cadena, a propósito: es la decisión correcta
     para no perder decimales en cifras grandes. Acá el número entra en un float
     sin margen de error —son precios de dos decimales— y el resto del sitio
     espera un número. */
  return rows.map(({ size, price }) => ({ size, price: Number(price) }));
}

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
export async function catalogVariants(
  db: Pool | PoolClient,
  stock: number,
): Promise<NormalizedVariant[]> {
  const sizes = await catalogSizes(db);
  return sizes.map(({ size, price }) => ({ size, price, stock }));
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
