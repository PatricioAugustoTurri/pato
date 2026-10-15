/**
 * La cuenta de Cloudinary donde vive el catálogo, en un solo lugar.
 *
 * El loader de imágenes (`src/lib/image-loader.ts`) solo sabe pedirle
 * tamaños y formatos a esta cuenta: una URL de otro origen se muestra tal cual,
 * sin optimizar. Por eso el panel valida contra esta misma constante en vez de
 * tener su propia copia, que podría quedar vieja el día que la cuenta cambie.
 */
export const CLOUDINARY_CLOUD_NAME = "dvmsjdcqi";

export const CLOUDINARY_HOST = "res.cloudinary.com";

/** El prefijo que tiene que tener toda imagen del catálogo. */
export const CATALOG_IMAGE_PREFIX = `https://${CLOUDINARY_HOST}/${CLOUDINARY_CLOUD_NAME}/`;

/**
 * ¿Esta URL es del catálogo, o sea, se le pueden pedir transformaciones?
 *
 * Comprueba el origen y la cuenta. No comprueba
 * que el archivo exista —eso solo lo sabe Cloudinary— pero ataja el error que
 * de verdad pasa, que es pegar la URL de otra cuenta o de otro sitio.
 */
export function isCatalogImageUrl(url: string): boolean {
  return url.trim().startsWith(CATALOG_IMAGE_PREFIX);
}

/**
 * La firma del autor sobre cada obra: "PT" en Playfair Display itálica, la
 * misma cara que el "Turri" del wordmark, abajo a la derecha, en papel.
 * Decisión del usuario (2026-10-15): una firma en la esquina, no un sello
 * encima de la foto, y solo en el catálogo.
 *
 * Va estampada por Cloudinary dentro del archivo, no dibujada con CSS: así la
 * lleva también la imagen que alguien guarda o arrastra al escritorio. El
 * tamaño y el margen son relativos al ancho de la imagen (`fl_relative`), así
 * que la firma mide lo mismo en proporción en una miniatura de 640 que en la
 * pantalla completa de 3840.
 *
 * Por debajo de WATERMARK_MIN_WIDTH no se estampa: en el carrito, los pedidos
 * o un mail la firma mediría unos pocos píxeles y sería una mancha, y nadie
 * roba una obra a ese tamaño.
 */
const MARK_TEXT = "Playfair%20Display_200_italic:PT";
/* Dos capas: abajo la misma "PT" en tinta, desenfocada y corrida un pelo, que
   hace de sombra; encima la firma en papel. Sin la sombra, sobre un cielo o un
   pavimento claro la firma desaparecía. `e_shadow` no se aplica a una capa de
   texto en Cloudinary, por eso se arma a mano. */
const WATERMARK = [
  `l_text:${MARK_TEXT},co_rgb:25231F,o_45/c_scale,fl_relative,w_0.07/e_blur:300/fl_layer_apply,g_south_east,x_0.033,y_0.032`,
  `l_text:${MARK_TEXT},co_rgb:F4F1EB,o_70/c_scale,fl_relative,w_0.07/fl_layer_apply,g_south_east,x_0.035,y_0.035`,
].join("/");
export const WATERMARK_MIN_WIDTH = 600;

/** Donde empieza, dentro de una URL de Cloudinary, lo que se puede transformar. */
const UPLOAD_MARKER = "/image/upload/";

/**
 * La misma fotografía, pedida a Cloudinary en el tamaño en que se va a ver.
 *
 * La usan las `next/image` del catálogo, a través del loader, y las obras que
 * son fondo CSS —los cuadros de la portada, los de /destinations, las fichas del
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
 *
 * `quality` es el número que pide `next/image` (75, 85, 90). Cloudinary no lo
 * recibe tal cual: `q_auto` ajusta la compresión a cada foto, y 88 o más pasa
 * a `q_auto:best`, que es lo que piden los heroes, donde la fotografía ocupa
 * la pantalla entera y la diferencia se ve.
 */
export function catalogImage(url: string, width: number, quality?: number): string {
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

  const q = quality !== undefined && quality >= 88 ? "q_auto:best" : "q_auto";
  const resize = `f_auto,${q},w_${width},c_limit`;
  const mark = width >= WATERMARK_MIN_WIDTH ? `/${WATERMARK}` : "";
  return `${head}${resize}${mark}/${tail}`;
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
