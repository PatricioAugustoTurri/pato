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

/**
 * La tarifa, buscada por el nombre que viaja a Stripe.
 *
 * El webhook recibe de vuelta el `display_name` que se mandó —"Shipping in
 * Italy"—, no la zona. Este es el camino de regreso, y por eso `name` es la
 * clave: es el único dato que sobrevive el viaje de ida y vuelta por Stripe.
 */
export function shippingRateByName(name: string | null) {
  if (!name) return null;
  return SHIPPING_RATES.find((rate) => rate.name === name) ?? null;
}

/** Suma días hábiles a una fecha, salteando sábados y domingos. */
function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let left = days;

  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      left -= 1;
    }
  }

  return date;
}

/**
 * La ventana de entrega de un pedido, en fechas concretas.
 *
 * Los plazos del sitio están en días hábiles —"2-5 días"— porque así se
 * anuncian y así los entiende Stripe. Pero a quien acaba de comprar, "2-5 días
 * hábiles" le pide una cuenta con un calendario al lado; una fecha no. Se
 * calcula sobre la fecha del pedido y salteando fines de semana, que es lo que
 * "hábil" significa.
 *
 * No contempla feriados: son distintos en cada uno de los 27 países a los que
 * se envía, y una estimación que se pasa por un día es honesta mientras se
 * anuncie como estimación. Por eso las dos puntas viajan siempre, y quien la
 * muestra la escribe como un rango y no como una promesa.
 */
export function deliveryWindow(
  optionName: string | null,
  from: Date,
): { min: Date; max: Date } | null {
  const rate = shippingRateByName(optionName);
  if (!rate) return null;

  return {
    min: addBusinessDays(from, rate.minDays),
    max: addBusinessDays(from, rate.maxDays),
  };
}
