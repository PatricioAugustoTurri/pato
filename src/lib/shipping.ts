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

/** Las tarifas con la forma exacta que espera Stripe Checkout. */
export function stripeShippingOptions() {
  return SHIPPING_RATES.map(({ name, amount, minDays, maxDays }) => ({
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: { amount, currency: "eur" },
      display_name: name,
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: minDays },
        maximum: { unit: "business_day" as const, value: maxDays },
      },
    },
  }));
}
