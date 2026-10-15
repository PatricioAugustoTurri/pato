/**
 * Eventos de Umami, la analítica del sitio.
 *
 * Umami corre en el mismo servidor que la tienda, no deja cookies y no guarda
 * la IP ni nada que identifique a una persona: cuenta visitas y eventos. Por
 * eso no hace falta banner de consentimiento, y por eso la página de
 * privacidad lo puede decir sin letra chica.
 *
 * El script se carga en el layout solo si están las dos variables
 * (`NEXT_PUBLIC_UMAMI_SRC` y `NEXT_PUBLIC_UMAMI_WEBSITE_ID`). Sin ellas, o con
 * un bloqueador, `window.umami` no existe y `track` no hace nada: medir nunca
 * puede romper una compra.
 *
 * Los eventos son pocos a propósito, y cuentan el embudo de la tienda:
 *   add_to_cart     una obra entra al carrito (ficha de la obra)
 *   checkout_start  se aprieta "Checkout" en el carrito
 *   purchase        se vuelve de Stripe con el pago hecho
 */

type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

export type ShopEvent = "add_to_cart" | "checkout_start" | "purchase";

export function track(event: ShopEvent, data?: EventData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(event, data);
  } catch {
    /* Un error de la analítica no es asunto de quien está comprando. */
  }
}
