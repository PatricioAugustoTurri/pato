/**
 * Los datos estructurados del sitio: lo mismo que ya dice la página, dicho en
 * el formato que leen Google y los asistentes.
 *
 * No hay nada acá que no esté en la pantalla. Declarar un precio, un stock o
 * una reseña que la página no sostiene es lo que Google penaliza, y además
 * rompería el principio de la casa: no prometer lo que no se cumple.
 */
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

/** El nodo del autor. `@id` estable para que todo lo demás lo referencie. */
const PERSON_ID = `${SITE_URL}/#person`;

/**
 * Pato, la persona.
 *
 * `sameAs` es lo que le permite a Google atar este sitio a las cuentas de
 * Instagram y YouTube y tratarlos como un mismo autor en vez de como tres
 * desconocidos con el mismo nombre. Las direcciones llegan desde `SOCIAL`, que
 * es donde ya viven: una segunda copia acá podría quedar vieja sin que nadie
 * se entere.
 */
export function personSchema(socialUrls: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: AUTHOR,
    url: SITE_URL,
    jobTitle: "Photographer",
    description: SITE_DESCRIPTION,
    sameAs: socialUrls,
  };
}

/** El sitio como obra, atado a su autor. */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
  };
}

/**
 * Las migas de pan.
 *
 * Es lo que hace que en el resultado de Google se lea
 * `patoturri.com › shop › landscape` en vez de la URL cruda: dice de dónde
 * cuelga la obra antes de que nadie haga clic.
 */
export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

type ProductInput = {
  name: string;
  description: string;
  image: string;
  path: string;
  /** Los precios reales de `photo_variants`, en euros. */
  prices: number[];
  inStock: boolean;
};

/**
 * Una obra como producto.
 *
 * Es la pieza que más mueve la aguja de todo este trabajo: es lo que permite
 * que un resultado de búsqueda muestre el precio y la disponibilidad debajo
 * del título en vez de solo un enlace.
 *
 * Va como `AggregateOffer` y no como tres ofertas sueltas porque la página es
 * una: tiene A4, A3 y A2 en un mismo selector, y lo que se anuncia es el rango
 * —"desde €40"—, que es exactamente lo que ve quien entra.
 */
export function productSchema({
  name,
  description,
  image,
  path,
  prices,
  inStock,
}: ProductInput) {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    url,
    /* La marca es la persona: un catálogo de un solo autor no tiene fabricante
       ni licenciante detrás. */
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url,
      seller: { "@id": PERSON_ID },
    },
  };
}

/**
 * Una colección como listado.
 *
 * `ItemList` le dice al buscador qué obras cuelgan de esta página y en qué
 * orden, que es la diferencia entre una colección tratada como texto suelto y
 * una tratada como índice de un catálogo.
 */
export function collectionSchema({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": PERSON_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}
