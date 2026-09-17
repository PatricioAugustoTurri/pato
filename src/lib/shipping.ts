/**
 * Las tarifas de envío del sitio, en un solo lugar.
 *
 * Vivían dentro de la llamada a Stripe. Cualquier página que quisiera
 * anunciarlas tenía que copiarlas a mano, y una copia a mano es una promesa que
 * puede quedar vieja sin que nadie se entere: el visitante lee 5,00 EUR en una
 * página y paga otra cosa en el checkout. Acá se declaran una vez, el checkout
 * arma sus `shipping_options` desde esto y la página de contacto lee lo mismo.
 *
 * `amount` va en céntimos porque es lo que cobra Stripe; formatear es cosa de
 * la interfaz, no del dato.
 *
 * `name` viaja a Stripe como `display_name`, así que está en inglés: es el
 * idioma del sitio, y la página de pago es la pantalla siguiente a la nuestra.
 * `label` es la forma corta para las tablas de la interfaz, donde el nombre
 * entero repetiría "Shipping" en las dos filas. `region` es la clave estable
 * para las pantallas que todavía no están traducidas: nombran el destino en su
 * propio idioma, pero la tarifa y los plazos los siguen leyendo de acá.
 */
export const SHIPPING_RATES = [
  { region: "it", name: "Shipping in Italy", label: "Italy", amount: 500, minDays: 2, maxDays: 5 },
  { region: "eu", name: "Shipping to the rest of the EU", label: "Rest of the EU", amount: 1000, minDays: 4, maxDays: 10 },
] as const;

export type ShippingRegion = (typeof SHIPPING_RATES)[number]["region"];

/**
 * La moneda en la que cobra la tienda.
 *
 * El envío es un importe fijo en euros, y Stripe no acepta una sesión con dos
 * monedas mezcladas: si una variante del catálogo quedara cargada en otra, la
 * sesión entera se cae. Declarada acá, el checkout puede comprobar cada precio
 * contra la misma constante que arma la tarifa, en vez de contra un "eur"
 * escrito a mano en dos archivos que podrían dejar de coincidir.
 */
export const SHIPPING_CURRENCY = "eur";

/**
 * Los países de cada zona.
 *
 * Antes la lista de los 27 vivía dentro de la ruta de checkout y las dos
 * tarifas se mandaban juntas a Stripe. La página alojada de Stripe NO sabe
 * filtrar tarifas por dirección —lo dice su propia documentación—, así que las
 * dibujaba como un selector y cualquiera podía elegir «Shipping in Italy» y
 * pagar 5 EUR desde Finlandia.
 *
 * Con la zona elegida antes de crear la sesión, Stripe recibe UNA tarifa y solo
 * los países que le corresponden: ya no es cuestión de confiar en que el
 * comprador elija bien, es que la combinación equivocada no se puede escribir.
 */
const ITALY = ["IT"] as const;

const REST_OF_EU = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;

export const SHIPPING_COUNTRIES: Record<ShippingRegion, readonly string[]> = {
  it: ITALY,
  eu: REST_OF_EU,
};

/** ¿Es `value` una de las dos zonas? El cliente propone, el servidor comprueba. */
export function isShippingRegion(value: unknown): value is ShippingRegion {
  return SHIPPING_RATES.some((rate) => rate.region === value);
}

/** La tarifa de una zona. */
export function shippingRate(region: ShippingRegion) {
  return SHIPPING_RATES.find((rate) => rate.region === region) ?? SHIPPING_RATES[0];
}

/**
 * La tarifa de la zona elegida, con la forma exacta que espera Stripe Checkout.
 *
 * Devuelve una sola: mandar las dos era lo que dejaba elegir la equivocada.
 */
export function stripeShippingOptions(region: ShippingRegion) {
  return [shippingRate(region)].map(({ name, amount, minDays, maxDays }) => ({
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: { amount, currency: SHIPPING_CURRENCY },
      display_name: name,
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: minDays },
        maximum: { unit: "business_day" as const, value: maxDays },
      },
    },
  }));
}
