/**
 * Países de la portada, en el orden en que se muestran.
 *
 * El orden de este array ES el orden de la página: antes se ordenaba por
 * cantidad de obras, y bastaba marcar una foto más para que un país saltara
 * de puesto solo. Acá el orden es una decisión, no un efecto secundario.
 *
 * `intro` es el relato del viaje. Solo se escribe lo que el fotógrafo confirmó:
 * un país sin texto muestra sus obras sin relato, en vez de inventarle uno.
 */
export const COUNTRIES: { name: string; intro: string | null }[] = [
  {
    name: "Vietnam",
    intro:
      "Un mes recorriendo el norte del país en moto, entrando en lugares por los que casi nadie pasa. Estas fotografías son lo que encontramos ahí adentro.",
  },
  {
    name: "Tailandia",
    intro: null,
  },
];

const ORDER = new Map(COUNTRIES.map(({ name }, index) => [name, index]));

export function countryIntro(country: string): string | null {
  return COUNTRIES.find(({ name }) => name === country)?.intro ?? null;
}

/**
 * Posición de un país. Los que no están en la lista van al final, para que una
 * obra etiquetada con un país nuevo aparezca igual en vez de desaparecer.
 */
export function countryRank(country: string): number {
  return ORDER.get(country) ?? Number.MAX_SAFE_INTEGER;
}
