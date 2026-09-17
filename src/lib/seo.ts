/**
 * Los datos que todo el SEO del sitio repite, en un solo lugar.
 *
 * El dominio vive en una variable de entorno porque hasta que el sitio no esté
 * publicado no se sabe cuál es, y porque `metadataBase`, el sitemap, el
 * robots.txt y cada canónica tienen que coincidir exactamente: si una dice
 * `patoturri.com` y otra `www.patoturri.com`, Google las indexa como dos sitios
 * distintos y ninguno hereda la autoridad del otro.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://patoturri.com"
).replace(/\/$/, "");

export const SITE_NAME = "Pato Turri";

/** El autor es el producto: una sola persona detrás de todo el catálogo. */
export const AUTHOR = "Pato Turri";

/**
 * La descripción por defecto, y el molde de todas las demás: qué se vende,
 * de quién es, y a dónde llega. Google corta cerca de los 155 caracteres, así
 * que lo que importa va primero.
 */
export const SITE_DESCRIPTION =
  "Fine art travel photography prints by Pato Turri, printed to order in A4, A3 and A2. Shipped across Italy and the European Union.";

/**
 * Una URL absoluta a partir de una ruta del sitio.
 *
 * Open Graph y JSON-LD no aceptan rutas relativas: un `/shop` suelto en una
 * tarjeta de Twitter no resuelve contra nada y la vista previa queda rota.
 */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Los metadatos de una página, armados de una sola forma.
 *
 * Existe por una trampa de Next documentada en `generate-metadata.md`: los
 * campos anidados como `openGraph` NO se fusionan con los del layout padre, se
 * **reemplazan enteros**. Cada página que declaraba su propio `openGraph`
 * estaba borrando en silencio el `siteName`, el `locale` y la `url` del raíz, y
 * quedaba compartiendo tarjetas sin nombre de sitio.
 *
 * Al pasar por acá eso no puede volver a pasar: el que escribe una página nueva
 * decide el título, el texto y la ruta, y el resto viene solo.
 */
/**
 * La tarjeta por defecto, para las páginas que no son una obra.
 *
 * Se nombra por URL y no se deja al archivo `opengraph-image.tsx`: la imagen
 * por convención de archivo solo alcanza al segmento donde vive, y cualquier
 * página que declare su propio `openGraph` —o sea, todas las que pasan por
 * acá— la reemplaza y se queda sin tarjeta.
 */
const DEFAULT_OG_IMAGE = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — travel photography prints`,
};

export function pageMetadata({
  title,
  description,
  path,
  images,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
  type?: "website" | "article";
}) {
  const url = absoluteUrl(path);
  /* Una obra manda su propia fotografía; el resto del sitio comparte la
     tarjeta de la marca. Lo que nunca pasa es quedarse sin ninguna. */
  const cards = images?.length ? images : [DEFAULT_OG_IMAGE];

  return {
    title,
    description,
    /* La canónica es por página y nunca se hereda de arriba: dos páginas que
       declaran la misma son dos páginas peleando por un solo lugar en Google. */
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_GB",
      url,
      title,
      description,
      images: cards,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: cards,
    },
  };
}

/**
 * Un texto recortado para que entre en un resultado de búsqueda.
 *
 * Las descripciones del catálogo son texto de autor de más de mil caracteres.
 * Google muestra unos 155 y corta el resto donde caiga, a mitad de palabra. Si
 * hay que cortar, mejor cortarlo nosotros en un límite de palabra y cerrar con
 * puntos suspensivos, que es lo que distingue una frase que termina de una
 * frase que se quedó sin espacio.
 */
export function metaDescription(text: string, limit = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;

  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit).replace(/[.,;:—-]$/, "")}…`;
}
