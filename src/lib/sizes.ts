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
/*
 * Están las siete medidas de la serie A, no solo las tres que se venden hoy.
 *
 * Cuáles se venden y a qué precio lo decide `catalog_sizes`, desde el panel.
 * Esta tabla es la otra mitad: qué mide cada una. Escribir acá las que todavía
 * no están a la venta es lo que permite que agregar un A1 desde el panel sea
 * elegirlo de una lista y nada más —sale con su medida puesta— en vez de una
 * copia que aparece muda hasta que alguien toque el código.
 *
 * Es deliberado que esto NO esté en la base junto al precio. Un A4 mide
 * 21 × 29,7 cm en todo el mundo: es un hecho del papel, no una decisión. Y el
 * carrito, que corre en el navegador sobre lo que quedó en `localStorage`,
 * tiene que poder decirlo sin una consulta.
 */
export const SIZE_DIMENSIONS: Record<string, string> = {
  A0: "84.1 × 118.9 cm",
  A1: "59.4 × 84.1 cm",
  A2: "42 × 59.4 cm",
  A3: "29.7 × 42 cm",
  A4: "21 × 29.7 cm",
  A5: "14.8 × 21 cm",
  A6: "10.5 × 14.8 cm",
};

/** Los tamaños que el panel puede poner a la venta, del más chico al más grande. */
export const KNOWN_SIZES = ["A6", "A5", "A4", "A3", "A2", "A1", "A0"] as const;

/** La medida de un tamaño, o cadena vacía si no la conocemos. */
export function sizeDimensions(size: string): string {
  return SIZE_DIMENSIONS[size] ?? "";
}
