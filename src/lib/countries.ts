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
 * Los diecisiete países del catálogo están listados. Dieciséis tienen relato
 * de autor; el único sin escribir es China, que lleva `intro: null` y muestra
 * sus obras sin texto en vez de que se le invente uno. El hueco ya existe con
 * la forma puesta: cuando el autor lo escriba, es cambiar el `null` por la
 * cadena y nada más.
 *
 * Japón abre la lista por decisión del usuario (2026-09-16), por delante de
 * los dos países que sí tienen relato: es el archivo más grande del catálogo.
 * Que todavía no tenga texto escrito no lo baja de puesto —el orden lo decide
 * esta lista, no la cantidad de relato ni la de obras—, y por eso encabeza
 * tanto «My best memories» en la portada como el índice de /destinations.
 *
 * Alfabéticos **por el nombre en inglés**, que es el que se lee en pantalla:
 * la página está en inglés y un visitante que ve «Malaysia, Morocco, Mexico»
 * no ve una lista ordenada. Ordenar por el castellano de la base era ordenar
 * por un nombre que no está escrito en ningún lado. Por eso México quedó antes
 * que Marruecos, al revés que antes.
 *
 * Los cinco que llegaron con las altas de 2026-09 —China, España, Italia,
 * Japón y Perú— entran acá en su lugar. Hasta ahora caían al final por no
 * estar en la lista, que es la red de seguridad de `countryRank`, no un
 * orden.
 */
export const COUNTRIES: { name: string; intro: string | null }[] = [
  {
    name: "Japón",
    intro:
      "This country taught me that silence can be loud: in a crowded train, in a shrine at dawn, in the careful way someone wraps a gift I didn't even buy. I left with more bows than words, and somehow that was enough.",
  },
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
  {
    name: "Argentina",
    intro:
      "This country isn't a memory, it's home: the smell of asado on a Sunday, a stranger who becomes a friend over mate, the mountains and the sea both somehow mine. I don't visit Argentina, I return to it — again and again, in every other place I go.",
  },
  {
    name: "Bolivia",
    intro:
      "Nothing about this country came easy — not the altitude, not the roads, not a single sunrise. It didn't hand me anything; I had to earn every bit of it, and that's exactly why I came down tougher than I went up.",
  },
  {
    name: "Brasil",
    intro:
      "Even standing still, this place seemed to move — a rhythm in the way people talked, walked, argued, loved. I got swept up in it, and I'm still not sure I ever fully came back down.",
  },
  { name: "China", intro: null },
  {
    name: "Colombia",
    intro:
      "Nobody warned me how much this place would smile back at me — in the middle of a rainstorm, in a crowded market, in the middle of a stranger's story I didn't ask to hear. I went in cautious and left completely disarmed.",
  },
  {
    name: "Costa Rica",
    intro:
      "It took me all of two days to understand what 'pura vida' really means — not a phrase, but a whole way of moving through the world, slower and lighter than I knew how to be. I came looking for rainforest and left with a rhythm I still haven't fully let go of.",
  },
  {
    name: "Guatemala",
    intro:
      "A volcano smoking quietly above a colonial city taught me something about living alongside things you can't control — you just build your life in the shadow of them and keep going. I left with ash on my boots and a strange kind of calm I didn't expect.",
  },
  {
    name: "Italia",
    intro:
      "I reached a ridge here right as the light was giving up for the day, and stood there a while longer than I needed to, just to hold onto it. Italy gave me that — moments too good to rush, even alone on a mountain with no one to share them with.",
  },
  {
    name: "Malasia",
    intro:
      "Three cultures shared one plate, one street, one skyline here, and somehow none of it felt forced — just three ways of living side by side, each one worth stopping for. I came for a stopover and stayed far longer than planned.",
  },
  {
    name: "México",
    intro:
      "Death and celebration sit at the same table here, and somehow that made me less afraid of both. I came for the food and the ruins, and left with a completely different idea of what it means to honor a life.",
  },
  {
    name: "Marruecos",
    intro:
      "I got lost on purpose in a medina here and never quite found my way back to who I was before — the colors, the calls to prayer, the mint tea pressed into my hands by strangers all rearranged something in me. Some places you visit; this one rewired me a little.",
  },
  {
    name: "Paraguay",
    intro:
      "Barely anyone I know has been here, and that's exactly what made it feel like mine — tereré passed between hands in the shade, a language older than the border around it, a warmth nobody photographs. Some countries perform for visitors; this one just let me in.",
  },
  {
    name: "Perú",
    intro:
      "This is the country that made me walk uphill for days just to watch the sun rise over stones someone else stacked centuries before I was born — and somehow it felt worth every step. I came back different, and a little more tired, in the best way.",
  },
  {
    name: "España",
    intro:
      "I walked into mountain villages here that time seemed to have forgotten on purpose, stone houses and grazing cattle and nowhere in particular to be. It wasn't the Spain of postcards — it was quieter, older, and somehow more mine because of it.",
  },
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
 * presentación, no dato. Cubre los diecisiete países que hay hoy en el
 * catálogo; solo siete se escriben distinto —el resto entra igual para que la
 * tabla se lea completa y no haya que adivinar cuáles faltan.
 *
 * Las claves van plegadas con `fold()`, igual que en el resto del archivo, así
 * que «Japón», «Japon» y « japon » son la misma entrada. Antes se comparaba en
 * minúsculas a secas y hacía falta escribir «méxico» y «mexico» como dos
 * claves distintas; con el pliegue, un acento de más o de menos en el panel ya
 * no deja un país sin traducir.
 *
 * Es deliberado NO derivarlo de `ENGLISH_NAMES` en `place.ts`: esa tabla
 * existe para detectar si un título ya nombra el lugar, y sus valores son
 * términos de búsqueda («thai», «mexican»), no nombres para mostrar.
 */
const NAMES_EN: Record<string, string> = {
  argentina: "Argentina",
  bolivia: "Bolivia",
  brasil: "Brazil",
  china: "China",
  colombia: "Colombia",
  "costa rica": "Costa Rica",
  espana: "Spain",
  guatemala: "Guatemala",
  italia: "Italy",
  japon: "Japan",
  malasia: "Malaysia",
  marruecos: "Morocco",
  mexico: "Mexico",
  paraguay: "Paraguay",
  peru: "Peru",
  tailandia: "Thailand",
  vietnam: "Vietnam",
};

/**
 * El nombre del país para mostrar. Un país que no esté en la tabla se muestra
 * tal cual viene de la base: aparece igual, como hace `countryRank` con el
 * orden, en vez de desaparecer por no estar curado.
 */
export function countryLabel(country: string): string {
  return NAMES_EN[fold(country)] ?? country.trim();
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
