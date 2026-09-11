import { pool } from "@/lib/db";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { cleanTitle } from "@/lib/place";
import { sizeDimensions } from "@/lib/sizes";

/* Estados de un pedido, en el orden en que ocurren.
   El conjunto es cerrado del lado de la escritura: el checkout inserta
   `pending`, el webhook de Stripe pasa a `paid`, y el panel solo acepta los
   tres siguientes (`ALLOWED_STATUSES` en /api/admin/orders/[id]). Por eso el
   respaldo de `readStatus` no puede inventar un estado que no exista. */
export const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Una línea congelada en el momento de la compra.
 *
 * `photoId` es **string**, no número: así lo escribe el checkout dentro del
 * jsonb y así vuelve de la base (`{"photoId":"8"}`). El tipo del panel decía
 * `number` y era mentira; cualquier comparación numérica contra él fallaba en
 * silencio. `name` falta en los pedidos más viejos, de antes de que el checkout
 * lo guardara.
 */
export type OrderItemSnapshot = {
  photoId: string;
  size: string;
  quantity: number;
  unitAmountCents: number;
  name?: string;
};

/** La dirección tal cual la entrega Stripe, guardada como jsonb. */
export type OrderAddress = {
  city?: string | null;
  country?: string | null;
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  state?: string | null;
};

/** Una copia dentro de un pedido, ya resuelta contra el catálogo de hoy. */
export type OrderLine = {
  /* Los snapshots no traen identificador propio, así que la clave de React se
     arma con la posición dentro del pedido. */
  key: string;
  title: string;
  /* `null` cuando la obra ya no existe o perdió su colección: sin colección no
     hay ruta a la que enlazar. */
  href: string | null;
  imageUrl: string;
  alt: string;
  size: string;
  dimensions: string;
  quantity: number;
  lineCents: number;
  /* La obra ya no está en el catálogo. La línea igual se dibuja: es el recibo
     del comprador y sigue siendo cierto. */
  gone: boolean;
};

export type CustomerOrder = {
  id: number;
  status: OrderStatus;
  createdAt: Date;
  lines: OrderLine[];
  prints: number;
  /* Subtotal de las copias, sin envío. Siempre presente. */
  itemsCents: number;
  /* Envío y total quedan en NULL hasta que entra el webhook, así que un pedido
     sin confirmar no puede anunciar un total. */
  shippingCents: number | null;
  shippingOption: string | null;
  totalCents: number | null;
  address: OrderAddress | null;
};

type OrderRow = {
  id: number;
  status: string;
  items: unknown;
  totalCents: number;
  shippingOption: string | null;
  shippingAmountCents: number | null;
  amountTotalCents: number | null;
  shippingAddress: OrderAddress | null;
  createdAt: Date;
};

type PhotoRow = {
  /* `photos.id` es `bigint` en la base, y node-postgres devuelve los bigint
     como CADENA para no perder precisión. Todo lo demás que leemos acá es
     `integer` y llega como número, así que este es el único campo que hay que
     normalizar. Sin hacerlo, el Map queda con claves string, la búsqueda por
     número nunca acierta, y cada línea se dibuja sin miniatura y sin enlace
     como si la obra estuviera borrada: falla en silencio, que es la peor forma
     de fallar. */
  id: string | number;
  name: string;
  slug: string;
  images: unknown;
  categorySlug: string | null;
};

/**
 * Los pedidos de un cliente, con sus obras resueltas.
 *
 * Devuelve `null` —y no `[]`— cuando la consulta falla, que es la única
 * diferencia deliberada con el resto de `src/lib`. En la portada una estantería
 * vacía es inofensiva; acá `[]` se dibuja como "todavía no compraste nada", que
 * es una afirmación falsa sobre la plata de alguien. `null` significa "no se
 * pudo leer el libro" y la página dice eso.
 */
export async function getOrdersForUser(userId: number): Promise<CustomerOrder[] | null> {
  if (!Number.isInteger(userId) || userId <= 0) return [];

  try {
    const { rows } = await pool.query<OrderRow>(
      `SELECT id, status, items,
              total_cents           AS "totalCents",
              shipping_option       AS "shippingOption",
              shipping_amount_cents AS "shippingAmountCents",
              amount_total_cents    AS "amountTotalCents",
              shipping_address      AS "shippingAddress",
              created_at            AS "createdAt"
         FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC`,
      [userId],
    );

    if (rows.length === 0) return [];

    const photos = await fetchPhotos(collectPhotoIds(rows));
    return rows.map((row) => assembleOrder(row, photos));
  } catch {
    return null;
  }
}

/**
 * Las obras referidas por un conjunto de pedidos, en un solo viaje.
 *
 * `LEFT JOIN` a propósito, al revés que `getPhotosByFlag`: allá una obra sin
 * colección se excluye porque no tiene ruta y rompería el enlace de la portada.
 * Acá la obra ya se vendió —sigue teniendo imagen y nombre y pertenece al
 * recibo—, así que entra igual y lo único que pierde es el enlace.
 */
async function fetchPhotos(ids: number[]): Promise<Map<number, PhotoRow>> {
  if (ids.length === 0) return new Map();

  const { rows } = await pool.query<PhotoRow>(
    `SELECT p.id, p.name, p.slug, p.images, c.slug AS "categorySlug"
       FROM photos p
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ANY($1::int[])`,
    [ids],
  );

  return new Map(rows.map((row) => [Number(row.id), row]));
}

/**
 * Los ids de obra de todos los pedidos, deduplicados.
 *
 * La conversión se hace acá y no en SQL a propósito. `(item->>'photoId')::int`
 * LANZA EXCEPCIÓN si algún snapshot guarda algo que no sea numérico, y se
 * llevaría puesta la página entera de ese comprador por una sola línea vieja.
 * Filtrando en TypeScript, un item corrupto simplemente cae a su nombre
 * congelado y el resto del pedido se dibuja.
 */
function collectPhotoIds(rows: OrderRow[]): number[] {
  const ids = new Set<number>();

  for (const row of rows) {
    for (const item of readItems(row.items)) {
      const id = Number(item.photoId);
      if (Number.isInteger(id) && id > 0) ids.add(id);
    }
  }

  return [...ids];
}

function readItems(value: unknown): OrderItemSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is OrderItemSnapshot => typeof item === "object" && item !== null);
}

function readStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : "pending";
}

function assembleOrder(row: OrderRow, photos: Map<number, PhotoRow>): CustomerOrder {
  const items = readItems(row.items);

  const lines = items.map((item, index) => {
    const photo = photos.get(Number(item.photoId));
    /* Cadena de respaldo del título: el nombre vivo del catálogo, después el
       que quedó congelado en la compra, y recién al final el id. Los dos
       pedidos más viejos no guardaron nombre, así que sin el primer eslabón se
       quedarían sin título. */
    const title = cleanTitle(photo?.name ?? item.name ?? `Work #${item.photoId}`);
    const quantity = Number(item.quantity) || 1;

    return {
      key: `${row.id}-${index}`,
      title,
      href: photo && photo.categorySlug ? `/shop/${photo.categorySlug}/${photo.slug}` : null,
      imageUrl: photo ? normalizePhotoImage(photo.images) : "",
      alt: photo ? normalizePhotoAlt(photo.images, title) : "",
      size: item.size,
      dimensions: sizeDimensions(item.size),
      quantity,
      lineCents: Number(item.unitAmountCents) * quantity,
      gone: !photo,
    };
  });

  return {
    id: row.id,
    status: readStatus(row.status),
    createdAt: row.createdAt,
    lines,
    prints: lines.reduce((sum, line) => sum + line.quantity, 0),
    itemsCents: row.totalCents,
    shippingCents: row.shippingAmountCents,
    shippingOption: row.shippingOption,
    totalCents: row.amountTotalCents,
    address: row.shippingAddress,
  };
}

/**
 * La dirección de envío en una sola línea legible.
 *
 * Stripe la entrega como jsonb con campos sueltos y cualquiera de ellos puede
 * faltar, así que se arma descartando los vacíos en vez de dejar comas huérfanas.
 */
export function formatAddress(address: OrderAddress | null): string {
  if (!address) return "";

  return [address.line1, address.line2, address.postal_code, address.city, address.state, address.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
