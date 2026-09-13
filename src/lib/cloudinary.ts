/**
 * La cuenta de Cloudinary donde vive el catálogo, en un solo lugar.
 *
 * `next.config.ts` solo autoriza a `next/image` a optimizar imágenes de esta
 * cuenta. Una URL de cualquier otro origen no se muestra rota: hace fallar la
 * página entera de la obra. Por eso el panel valida contra esta misma
 * constante en vez de tener su propia copia, que podría quedar vieja el día
 * que la cuenta cambie.
 */
export const CLOUDINARY_CLOUD_NAME = "dvmsjdcqi";

export const CLOUDINARY_HOST = "res.cloudinary.com";

/** El prefijo que tiene que tener toda imagen del catálogo. */
export const CATALOG_IMAGE_PREFIX = `https://${CLOUDINARY_HOST}/${CLOUDINARY_CLOUD_NAME}/`;

/**
 * ¿Esta URL la puede servir `next/image`?
 *
 * Comprueba lo mismo que `remotePatterns`: el origen y la cuenta. No comprueba
 * que el archivo exista —eso solo lo sabe Cloudinary— pero ataja el error que
 * de verdad pasa, que es pegar la URL de otra cuenta o de otro sitio.
 */
export function isCatalogImageUrl(url: string): boolean {
  return url.trim().startsWith(CATALOG_IMAGE_PREFIX);
}
