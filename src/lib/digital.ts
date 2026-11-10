/**
 * El archivo digital: el JPG original de una obra, a máxima calidad, para que
 * quien lo compra lo imprima por su cuenta. Es la forma barata de llevarse una
 * foto y, sobre todo, un aporte al viaje en bici de Japón a Portugal.
 *
 * Vive como un "tamaño" más del carrito (`size: "Digital"`) para que el
 * carrito, el pedido, los mails y el panel lo traten igual que un A4 sin
 * aprender nada nuevo. Lo que cambia está acá: no tiene envío, se compra una
 * sola vez por obra y su precio no sale de `catalog_sizes` —esa lista son
 * medidas de papel y el panel de tamaños la reescribe entera—.
 *
 * Este archivo lo lee también el navegador (el carrito, la ficha): nada de
 * servidor acá. Lo que toca el disco está en `src/lib/originals.ts`.
 */

/** El nombre del "tamaño" en el carrito y en `orders.items`. */
export const DIGITAL_SIZE = "Digital";

/** El precio, en euros. Decisión de Pato (2026-11-10): €10 fijos por foto. */
export const DIGITAL_PRICE = 10;

/** Cuánto dura el link de descarga desde el pago. */
export const DOWNLOAD_DAYS = 14;

/**
 * Cuántas veces se puede bajar el archivo con el mismo link. Más de una porque
 * una descarga de 30 MB en el teléfono se corta, o se quiere bajar también en la
 * compu; no infinitas, para que un link reenviado no sea una copia gratis.
 */
export const MAX_DOWNLOADS = 5;

/** El techo de un original, en bytes. Pato trabaja con JPG de hasta 30 MB. */
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;

export function isDigital(size: string | null | undefined): boolean {
  return size === DIGITAL_SIZE;
}

/** Lo que se dice debajo del nombre, donde un A4 dice cuánto mide. */
export const DIGITAL_NOTE = "Full-resolution JPG";

/**
 * Hasta qué tamaño se imprime bien, a 300 ppp —lo que pide un laboratorio para
 * una copia que se mira de cerca—. En centímetros, el lado largo primero.
 */
export function printSizeAt300(width: number, height: number): string {
  const cm = (px: number) => Math.round((px / 300) * 2.54);
  const [long, short] = width >= height ? [width, height] : [height, width];
  return `${cm(long)} × ${cm(short)} cm`;
}

/** Megapíxeles, con un decimal. */
export function megapixels(width: number, height: number): string {
  return (Math.round((width * height) / 100_000) / 10).toLocaleString("en-GB");
}

/** Bytes en MB, con un decimal. */
export function megabytes(bytes: number): string {
  return (Math.round(bytes / 104_857.6) / 10).toLocaleString("en-GB");
}

/**
 * El uso que se permite, en una línea. Lo mismo dicen la ficha, la página de
 * descarga, el mail y /terms (que lo cuenta largo).
 */
export const DIGITAL_LICENSE =
  "For personal use: print it as many times and as large as you like, for your home or as a gift. Not for resale, commercial use or sharing the file.";

/** "Invitame algo en la ruta": el aporte de monto libre de Rumbo Oeste. */
export const DONATE_URL = "https://buy.stripe.com/aFa6oGdAPgPga5T7BKcfK02";
