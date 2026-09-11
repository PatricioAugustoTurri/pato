/**
 * Las medidas de cada tamaño del catálogo, en un solo lugar.
 *
 * Son un hecho, no una promesa: A4 es A4 en todos lados. El papel y el
 * laboratorio NO están confirmados con el autor, así que acá no hay gramaje ni
 * tipo de papel — sólo las medidas ISO.
 *
 * Vivían dentro de `PurchasePanel`. El carrito necesita decir lo mismo ("A3 ·
 * 29.7 × 42 cm") y una segunda copia a mano es una medida que puede quedar
 * vieja en una de las dos pantallas sin que nadie se entere.
 */
export const SIZE_DIMENSIONS: Record<string, string> = {
  A4: "21 × 29.7 cm",
  A3: "29.7 × 42 cm",
  A2: "42 × 59.4 cm",
};

/** La medida de un tamaño, o cadena vacía si no la conocemos. */
export function sizeDimensions(size: string): string {
  return SIZE_DIMENSIONS[size] ?? "";
}
