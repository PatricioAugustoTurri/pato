/**
 * Países de la portada, en el orden en que se muestran.
 *
 * El orden de este array ES el orden de la página: antes se ordenaba por
 * cantidad de obras, y bastaba marcar una foto más para que un país saltara
 * de puesto solo. Acá el orden es una decisión, no un efecto secundario.
 *
 * `intro` es el relato del viaje. Solo se escribe lo que el fotógrafo confirmó:
 * un país sin texto muestra sus obras sin relato, en vez de inventarle uno.
 *
 * Los doce países del catálogo están listados, tengan relato o no. Los diez
 * sin texto llevan `intro: null` y están en el orden exacto en que la página
 * ya los mostraba —alfabético, después de los dos curados—, así que listarlos
 * no movió nada de sitio: lo único que agrega es el hueco donde el autor
 * escribe, sin tener que acordarse de la forma del objeto ni de dónde va.
 */
export const COUNTRIES: { name: string; intro: string | null }[] = [
  {
    name: "Vietnam",
    intro:
      "A month riding through the north of the country on a motorbike, into places almost nobody passes through. These photographs are what we found in there.",
  },
  {
    name: "Tailandia",
    intro:
      "This country gave me far more than postcard landscapes: I carry the memory of its honest smiles, its golden temples at dusk, and that feeling of having found a small piece of peace on the other side of the world.",
  },
  { name: "Argentina", intro: null },
  { name: "Bolivia", intro: null },
  { name: "Brasil", intro: null },
  { name: "Colombia", intro: null },
  { name: "Costa Rica", intro: null },
  { name: "Guatemala", intro: null },
  { name: "Malasia", intro: null },
  { name: "Marruecos", intro: null },
  { name: "México", intro: null },
  { name: "Paraguay", intro: null },
];

/**
 * La forma en que se comparan los nombres de país en este archivo.
 *
 * La columna `pais` la escribe una persona en el panel: puede llegar
 * «México», «mexico» o « Mexico ». Comparar en crudo hacía que el relato y el
 * orden de un país dependieran de cómo se tipeó ese día. Se pliegan acentos,
 * mayúsculas y espacios, y se compara el resultado.
 */
function fold(country: string): string {
  return country
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

const ORDER = new Map(COUNTRIES.map(({ name }, index) => [fold(name), index]));

export function countryIntro(country: string): string | null {
  const key = fold(country);
  return COUNTRIES.find(({ name }) => fold(name) === key)?.intro ?? null;
}

/**
 * El nombre de cada país en inglés, para mostrar.
 *
 * La columna `pais` de la base guarda el castellano y no se toca: esto es
 * presentación, no dato. Cubre los doce países que hay hoy en el catálogo; de
 * ellos, solo cuatro se escriben distinto —el resto entra igual para que la
 * tabla se lea completa y no haya que adivinar cuáles faltan.
 *
 * Es deliberado NO derivarlo de `ENGLISH_NAMES` en `place.ts`: esa tabla
 * existe para detectar si un título ya nombra el lugar, y sus valores son
 * términos de búsqueda («thai», «mexican»), no nombres para mostrar.
 */
const NAMES_EN: Record<string, string> = {
  argentina: "Argentina",
  bolivia: "Bolivia",
  brasil: "Brazil",
  colombia: "Colombia",
  "costa rica": "Costa Rica",
  guatemala: "Guatemala",
  malasia: "Malaysia",
  marruecos: "Morocco",
  méxico: "Mexico",
  mexico: "Mexico",
  paraguay: "Paraguay",
  tailandia: "Thailand",
  vietnam: "Vietnam",
};

/**
 * El nombre del país para mostrar. Un país que no esté en la tabla se muestra
 * tal cual viene de la base: aparece igual, como hace `countryRank` con el
 * orden, en vez de desaparecer por no estar curado.
 */
export function countryLabel(country: string): string {
  return NAMES_EN[country.trim().toLowerCase()] ?? country;
}

/**
 * La dirección de un país: `/destinations/<slug>`.
 *
 * Sale del nombre en inglés, que es el que se lee en pantalla, y no del
 * castellano de la base: la dirección que alguien copia y pega dice
 * `/destinations/thailand`, igual que el título de la página. Plegado y con
 * guiones, así «Costa Rica» y «México» dan direcciones que se pueden escribir
 * a mano.
 */
export function countrySlug(country: string): string {
  return fold(countryLabel(country)).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Posición de un país. Los que no están en la lista van al final, para que una
 * obra etiquetada con un país nuevo aparezca igual en vez de desaparecer.
 */
export function countryRank(country: string): number {
  return ORDER.get(fold(country)) ?? Number.MAX_SAFE_INTEGER;
}
