/**
 * Un solo formato de dinero para todo el sitio.
 *
 * El catálogo cobra euros redondos (A4 €40 · A3 €55 · A2 €70), así que los dos
 * decimales de `40.00 EUR` no dicen nada y hacen ruido en una cifra que se lee
 * de un vistazo. Cuando el importe no es redondo —un total de carrito, por
 * ejemplo— los decimales vuelven solos.
 *
 * NOTA: el carrito, el checkout y el panel de admin todavía formatean a mano
 * con `toFixed(2)` y "EUR". Conviene pasarlos por acá en una sola barrida.
 */
export function formatPrice(value: number | string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `€${rounded}` : `€${rounded.toFixed(2)}`;
}
