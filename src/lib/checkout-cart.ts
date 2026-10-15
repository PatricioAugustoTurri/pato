import { MAX_PER_LINE } from "@/lib/cart-limits";

export type CheckoutRequestItem = {
  photoId: unknown;
  size: unknown;
  quantity: unknown;
};

export type WantedLine = { photoId: number; size: string; quantity: number };

export type ParsedCart =
  | { ok: true; lines: WantedLine[] }
  | { ok: false; error: string };

/**
 * Lo que se pide, ya comprobado y con las líneas repetidas sumadas.
 *
 * Vive fuera de la ruta para poder probarlo sin base ni Stripe: es la parte
 * del checkout que decide qué se cobra, y la única que se puede romper con un
 * carrito armado a mano.
 *
 * Sumarlas importa: la misma obra y el mismo tamaño podían llegar en dos
 * líneas —dos pestañas abiertas, un carrito viejo— y Stripe las cobraba como
 * dos renglones idénticos. Juntas, el comprador ve "3 copias" y no la misma
 * obra escrita tres veces.
 *
 * Y comprobarlas importa igual: la cantidad entraba por `Number(...) || 1`,
 * que aceptaba un -3, un 1,5 y un 1e21. Ninguno llegaba a cobrarse porque
 * Stripe los rechazaba, pero el comprador terminaba leyendo el error de
 * Stripe en pantalla en vez de que el carrito le dijera que estaba mal.
 */
export function parseCheckoutItems(items: unknown): ParsedCart {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const wanted = new Map<string, WantedLine>();

  for (const item of items as CheckoutRequestItem[]) {
    const photoId = Number(item?.photoId);
    const size = typeof item?.size === "string" ? item.size.trim() : "";
    const quantity = Number(item?.quantity);

    if (
      !Number.isInteger(photoId) ||
      photoId <= 0 ||
      !size ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return { ok: false, error: "There is something wrong with your cart. Empty it and try again." };
    }

    const key = `${photoId}|${size}`;
    const already = wanted.get(key)?.quantity ?? 0;
    wanted.set(key, { photoId, size, quantity: already + quantity });
  }

  /* El tope se comprueba DESPUES de sumar las lineas repetidas, que es la unica
     forma de que valga: dos lineas de seis copias de la misma obra y el mismo
     tamano pasan cualquier control que las mire por separado.

     Y se comprueba acá aunque el carrito ya lo impida, porque el carrito corre
     en el navegador: esto no es una segunda opinion, es la unica que cuenta. */
  for (const line of wanted.values()) {
    if (line.quantity > MAX_PER_LINE) {
      return {
        ok: false,
        error: `The maximum is ${MAX_PER_LINE} copies of the same size. Lower the quantity and try again.`,
      };
    }
  }

  return { ok: true, lines: [...wanted.values()] };
}
