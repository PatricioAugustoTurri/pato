/* Los titulos del catalogo son de autor y casi todos nombran el lugar dentro
   del propio titulo —"...in Vietnam", "A Face of Malaysia"—, mientras que la
   columna `pais` los guarda en castellano. Sin cruzarlos, la cartela de una
   obra dice "Riding Through the Green: A Countryside Portrait in Vietnam" y
   debajo repite "VIETNAM", que no agrega nada y le roba una linea a la obra.

   El cruce se hace por nombre en ingles porque es el idioma de los titulos.
   Cuando el titulo nombra la ciudad y no el pais —Hanoi, Antigua, Jujuy— el
   pais SI aporta, y entonces se muestra. */
const ENGLISH_NAMES: Record<string, string[]> = {
  "malasia": ["malaysia", "malaysian"],
  "tailandia": ["thailand", "thai"],
  "méxico": ["mexico", "mexican"],
  "mexico": ["mexico", "mexican"],
  "marruecos": ["morocco", "moroccan"],
  "brasil": ["brazil", "brazilian"],
  "paraguay": ["paraguay", "paraguayan"],
  "guatemala": ["guatemala", "guatemalan"],
  "vietnam": ["vietnam", "vietnamese"],
  "argentina": ["argentina", "argentine"],
  "colombia": ["colombia", "colombian"],
  "bolivia": ["bolivia", "bolivian"],
  "costa rica": ["costa rica", "costa rican"],
};

function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * ¿El título ya nombra este país? Si lo hace, la cartela no lo repite.
 */
export function titleNamesPlace(title: string, pais: string | null | undefined): boolean {
  if (!pais) return false;
  const haystack = fold(title);
  const names = ENGLISH_NAMES[pais.toLowerCase()] ?? [];
  return [pais, ...names].some((name) => new RegExp(`\\b${fold(name)}\\b`).test(haystack));
}

/**
 * Cuatro títulos de la base arrastran una comilla recta suelta que quedó de la
 * carga —abre y no cierra, o cierra y no abre—. Se limpia al mostrar, no en la
 * base: el dato es del autor y esto es una corrección de presentación.
 */
export function cleanTitle(title: string): string {
  const trimmed = title.trim();
  const quotes = (trimmed.match(/"/g) ?? []).length;
  if (quotes % 2 === 0) return trimmed;
  return trimmed.replace(/^"|"$/g, "").trim();
}
