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

/** Donde empieza, dentro de una URL de Cloudinary, lo que se puede transformar. */
const UPLOAD_MARKER = "/image/upload/";

/**
 * La misma fotografía, pedida a Cloudinary en el tamaño en que se va a ver.
 *
 * Las obras que se dibujan con `next/image` ya bajan optimizadas; las que son
 * fondo CSS —los cuadros de la portada, los de /destinations, las fichas del
 * panel— bajaban el original tal como salió de la cámara. Una miniatura de 350
 * píxeles pesaba 3,7 MB, y la portada entera 23 MB de fotografías que nadie ve
 * a ese tamaño.
 *
 * `f_auto` deja que Cloudinary elija el formato que acepta el navegador (AVIF,
 * si no WebP, si no el original), `q_auto` la compresión, y `w_<n>` el ancho.
 * `c_limit` es la diferencia entre encoger y recortar: una foto más chica que
 * el ancho pedido se sirve como está en vez de agrandarse.
 *
 * El trabajo lo hace Cloudinary y lo sirve desde su CDN, así que no cuesta ni
 * CPU ni disco en el servidor —que es el mismo argumento por el que el catálogo
 * vive allá y no en `public/`.
 *
 * El ancho se pide en píxeles de imagen, no de CSS: para una caja de 350 hay
 * que pedir 700, porque una pantalla retina dibuja dos por cada uno.
 *
 * Una URL que no sea de esta cuenta vuelve intacta: esto es una optimización,
 * y una optimización no puede ser la razón de que una imagen no aparezca.
 */
export function catalogImage(url: string, width: number): string {
  if (!isCatalogImageUrl(url)) {
    return url;
  }

  const at = url.indexOf(UPLOAD_MARKER);
  if (at === -1) {
    return url;
  }

  const head = url.slice(0, at + UPLOAD_MARKER.length);
  const tail = url.slice(at + UPLOAD_MARKER.length);

  /* Una URL que ya trae transformación se deja quieta: la escribió alguien a
     propósito y encimarle otra da un resultado que no pidió nadie. Hoy no hay
     ninguna así en la base, pero se pegan a mano desde el panel. */
  if (/^[a-z]{1,2}_[^/]*\//.test(tail)) {
    return url;
  }

  return `${head}f_auto,q_auto,w_${width},c_limit/${tail}`;
}

/**
 * La miniatura cuadrada de una obra para un mail.
 *
 * No recorta: la obra entra entera y lo que sobra del cuadrado se rellena con
 * el color de fondo del mail, así que el relleno es invisible y una copia
 * vertical y una horizontal se siguen leyendo distintas. Recortar la mercadería
 * a un cuadrado decorativo está prohibido en el sistema de diseño, y un recibo
 * no es la excepción: la proporción es parte de lo que la persona compró.
 *
 * `c_pad` y no `c_fit`, que fue lo primero que hubo acá. `c_fit` devuelve la
 * imagen con SU proporción —una vertical de 4128×6192 vuelve 107×160, no
 * 160×160—, y en un mail la miniatura lleva `width` y `height` como atributos
 * porque varios clientes ignoran el CSS de una imagen. Con una imagen que no es
 * cuadrada, esos dos atributos la aplastan. Pidiendo el cuadrado ya hecho, los
 * atributos dicen la verdad y no hace falta que el cliente entienda
 * `object-fit` para que la obra se vea bien.
 *
 * Al doble del tamaño en que se dibuja, porque los teléfonos donde se abre un
 * mail son casi todos de densidad doble.
 */
export function catalogThumb(url: string, box: number, background = "f4f1eb"): string {
  if (!isCatalogImageUrl(url)) {
    return url;
  }

  const at = url.indexOf(UPLOAD_MARKER);
  if (at === -1) {
    return url;
  }

  const head = url.slice(0, at + UPLOAD_MARKER.length);
  const tail = url.slice(at + UPLOAD_MARKER.length);

  if (/^[a-z]{1,2}_[^/]*\//.test(tail)) {
    return url;
  }

  return `${head}f_auto,q_auto,c_pad,b_rgb:${background},w_${box},h_${box}/${tail}`;
}
