"use client";

import { catalogImage, isCatalogImageUrl } from "@/lib/cloudinary";
import localPhotos from "@/lib/local-photos.json";

type LocalPhoto = { base: string; hash: string; widths: number[] };

const LOCAL = localPhotos as Record<string, LocalPhoto>;

/**
 * El loader de todas las `next/image` del sitio (`images.loaderFile`).
 *
 * El catálogo lo sirve Cloudinary, ya en el ancho y el formato justos: AVIF o
 * WebP según el navegador, desde su CDN. Antes cada foto pasaba por el
 * optimizador de Next en nuestro servidor, que bajaba el original de 2 a 4 MB
 * de Cloudinary y lo recomprimía: el primer visitante de cada tamaño esperaba
 * hasta 3 segundos y el servidor gastaba CPU en cada uno. Los originales de la
 * base no se tocan —son los que se imprimen—; lo que se optimiza es la entrega.
 *
 * Las fotografías propias del sitio (portada, tienda, historia) ya están
 * generadas de antemano en cinco anchos por `scripts/optimize-local-photos.mjs`:
 * acá se elige el más chico que alcance para el ancho pedido.
 *
 * Cualquier otra dirección vuelve como está. Esto es una optimización, y una
 * optimización no puede ser la razón de que una imagen no aparezca.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (isCatalogImageUrl(src)) {
    return catalogImage(src, width, quality);
  }

  const local = LOCAL[src];
  if (local) {
    const pick = local.widths.find((w) => w >= width) ?? local.widths[local.widths.length - 1];
    return `/Pato/optimized/${local.base}-${pick}.${local.hash}.webp`;
  }

  return src;
}
