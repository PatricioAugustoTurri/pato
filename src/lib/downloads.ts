import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { DIGITAL_SIZE, DOWNLOAD_DAYS, MAX_DOWNLOADS } from "@/lib/digital";
import { cleanTitle } from "@/lib/place";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";

/**
 * Los permisos de descarga de los archivos digitales.
 *
 * Uno por obra comprada, creado por el webhook en la misma transacción que
 * marca el pedido cobrado: si Stripe reintenta el evento, el UPDATE no vuelve
 * fila y no se crean dos. El `UNIQUE (order_id, photo_id)` es el cinturón.
 */

export type DownloadLink = {
  token: string;
  title: string;
  /** La página de descarga, relativa al sitio: `/descarga/<token>`. */
  path: string;
};

export type DownloadDetail = {
  token: string;
  title: string;
  slug: string;
  imageUrl: string;
  alt: string;
  file: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  downloads: number;
  maxDownloads: number;
  expiresAt: Date;
  expired: boolean;
};

export function downloadPath(token: string): string {
  return `/descarga/${token}`;
}

/** Crea los permisos de un pedido recién cobrado y los devuelve. */
export async function createDownloads(
  client: PoolClient,
  orderId: number,
  photoIds: number[],
): Promise<DownloadLink[]> {
  const links: DownloadLink[] = [];

  for (const photoId of [...new Set(photoIds)]) {
    const token = randomBytes(24).toString("base64url");
    const { rows } = await client.query<{ token: string; name: string }>(
      `WITH created AS (
         INSERT INTO digital_downloads (order_id, photo_id, token, max_downloads, expires_at)
         VALUES ($1, $2, $3, $4, now() + make_interval(days => $5))
         ON CONFLICT (order_id, photo_id) DO NOTHING
         RETURNING token, photo_id
       )
       SELECT created.token, p.name FROM created JOIN photos p ON p.id = created.photo_id`,
      [orderId, photoId, token, MAX_DOWNLOADS, DOWNLOAD_DAYS],
    );
    if (rows[0]) {
      links.push({ token: rows[0].token, title: cleanTitle(rows[0].name), path: downloadPath(rows[0].token) });
    }
  }

  return links;
}

/**
 * Los links de un pedido, buscado por la sesión de Stripe. Es lo que lee la
 * página de "gracias": el `session_id` que Stripe pone en la URL de vuelta es
 * largo y no se adivina, y solo devuelve algo cuando el pedido ya está cobrado.
 */
export async function downloadsForSession(
  sessionId: string,
): Promise<{ paid: boolean; ships: boolean; links: DownloadLink[] } | null> {
  const { rows: orders } = await pool.query<{ id: number; status: string; ships: boolean }>(
    `SELECT id, status,
            EXISTS (SELECT 1 FROM jsonb_array_elements(items) item WHERE item->>'size' <> $2) AS ships
     FROM orders WHERE stripe_session_id = $1`,
    [sessionId, DIGITAL_SIZE],
  );
  const order = orders[0];
  if (!order) return null;
  if (order.status === "pending") return { paid: false, ships: order.ships, links: [] };

  const { rows } = await pool.query<{ token: string; name: string }>(
    `SELECT d.token, p.name
     FROM digital_downloads d JOIN photos p ON p.id = d.photo_id
     WHERE d.order_id = $1
     ORDER BY d.id`,
    [order.id],
  );

  return {
    paid: true,
    ships: order.ships,
    links: rows.map((row) => ({ token: row.token, title: cleanTitle(row.name), path: downloadPath(row.token) })),
  };
}

export async function getDownload(token: string): Promise<DownloadDetail | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;

  const { rows } = await pool.query<{
    token: string;
    name: string;
    slug: string;
    images: unknown;
    file: string | null;
    bytes: string | null;
    width: number | null;
    height: number | null;
    downloads: number;
    maxDownloads: number;
    expiresAt: Date;
    expired: boolean;
  }>(
    `SELECT d.token, p.name, p.slug, p.images,
            p.original_file AS file, p.original_bytes AS bytes,
            p.original_width AS width, p.original_height AS height,
            d.downloads, d.max_downloads AS "maxDownloads", d.expires_at AS "expiresAt",
            d.expires_at <= now() AS expired
     FROM digital_downloads d JOIN photos p ON p.id = d.photo_id
     WHERE d.token = $1`,
    [token],
  );

  const row = rows[0];
  if (!row) return null;

  const title = cleanTitle(row.name);
  return {
    ...row,
    title,
    bytes: row.bytes === null ? null : Number(row.bytes),
    imageUrl: normalizePhotoImage(row.images),
    alt: normalizePhotoAlt(row.images, title),
  };
}

/**
 * Cuenta una descarga y devuelve qué archivo mandar, o null si el link venció
 * o ya se usó todas las veces. Contar y comprobar van en el mismo UPDATE: dos
 * descargas a la vez no pueden pasar las dos por la última.
 */
export async function consumeDownload(
  token: string,
): Promise<{ file: string; slug: string } | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;

  const { rows } = await pool.query<{ file: string | null; slug: string }>(
    `UPDATE digital_downloads d
     SET downloads = d.downloads + 1, last_downloaded_at = now()
     FROM photos p
     WHERE d.token = $1 AND p.id = d.photo_id
       AND d.expires_at > now() AND d.downloads < d.max_downloads
       AND p.original_file IS NOT NULL
     RETURNING p.original_file AS file, p.slug`,
    [token],
  );

  const row = rows[0];
  return row?.file ? { file: row.file, slug: row.slug } : null;
}

/** Devuelve la descarga que se contó si el archivo no se pudo mandar. */
export async function refundDownload(token: string): Promise<void> {
  await pool.query(
    "UPDATE digital_downloads SET downloads = greatest(downloads - 1, 0) WHERE token = $1",
    [token],
  );
}
