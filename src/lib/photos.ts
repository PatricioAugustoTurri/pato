import { pool } from "@/lib/db";
import { countryRank } from "@/lib/countries";

export type PreferredPhoto = {
  id: number;
  name: string;
  slug: string;
  images: unknown;
  pais: string | null;
  categoryName: string;
  categorySlug: string;
};

export type CountryGroup = {
  country: string;
  photos: PreferredPhoto[];
};

/** Banderas de portada. Lista cerrada: nunca se interpola texto externo en SQL. */
const FLAG_COLUMNS = {
  preferidos: "p.preferidos",
  oferta: "p.oferta",
} as const;

export type PhotoFlag = keyof typeof FLAG_COLUMNS;

/**
 * Fotografías marcadas con una bandera del panel, para las secciones de la
 * portada.
 *
 * El INNER JOIN con categories no es decorativo: una obra sin colección no
 * tiene ruta a la que enlazar (`/shop/[slug]/[photoSlug]` la haría 404), así
 * que se excluye acá en vez de romper el enlace en la home.
 */
export async function getPhotosByFlag(flag: PhotoFlag, limit = 3): Promise<PreferredPhoto[]> {
  try {
    const { rows } = await pool.query<PreferredPhoto>(
      `SELECT p.id, p.name, p.slug, p.images, p.pais,
              c.name AS "categoryName", c.slug AS "categorySlug"
       FROM photos p
       INNER JOIN categories c ON c.id = p.category_id
       WHERE ${FLAG_COLUMNS[flag]}
       ORDER BY p.id DESC
       LIMIT $1`,
      [limit],
    );
    return rows;
  } catch {
    return [];
  }
}

export const getPreferredPhotos = (limit = 3) => getPhotosByFlag("preferidos", limit);
export const getOfferPhotos = (limit = 3) => getPhotosByFlag("oferta", limit);

/**
 * Obras preferidas agrupadas por país, para la portada.
 *
 * Una obra sin país queda fuera: el país es el encabezado de cada bloque, así
 * que sin ese dato no hay dónde ponerla. El límite es por país, no global, para
 * que un país con muchas fotos no desplace a los demás.
 */
export async function getPreferredByCountry(perCountry = 3): Promise<CountryGroup[]> {
  try {
    const { rows } = await pool.query<PreferredPhoto>(
      `SELECT p.id, p.name, p.slug, p.images, p.pais,
              c.name AS "categoryName", c.slug AS "categorySlug"
       FROM photos p
       INNER JOIN categories c ON c.id = p.category_id
       WHERE p.preferidos AND p.pais IS NOT NULL
       ORDER BY p.pais, p.id DESC`,
    );

    const byCountry = new Map<string, PreferredPhoto[]>();
    for (const photo of rows) {
      const country = photo.pais as string;
      const group = byCountry.get(country) ?? [];
      if (group.length < perCountry) {
        group.push(photo);
      }
      byCountry.set(country, group);
    }

    // Manda el orden declarado en countries.ts; los países no listados van al
    // final, alfabéticamente.
    return Array.from(byCountry, ([country, photos]) => ({ country, photos })).sort(
      (a, b) =>
        countryRank(a.country) - countryRank(b.country) ||
        a.country.localeCompare(b.country, "es"),
    );
  } catch {
    return [];
  }
}

export type ArchiveCounts = { obras: number; colecciones: number; paises: number };

/**
 * Cifras reales del archivo, para el hero. La referencia visual usaba un
 * "63+ happy clients" inventado; acá van números que salen de la base y que
 * se pueden verificar contando el catálogo.
 */
export async function getArchiveCounts(): Promise<ArchiveCounts> {
  try {
    const { rows } = await pool.query<ArchiveCounts>(
      `SELECT count(*) FILTER (WHERE category_id IS NOT NULL)::int AS obras,
              count(DISTINCT category_id)::int AS colecciones,
              count(DISTINCT pais)::int AS paises
       FROM photos`,
    );
    return rows[0] ?? { obras: 0, colecciones: 0, paises: 0 };
  } catch {
    return { obras: 0, colecciones: 0, paises: 0 };
  }
}


export type CountryChapter = CountryGroup & { total: number };

/**
 * Capítulos de país para la portada.
 *
 * Qué países aparecen lo sigue decidiendo la bandera "preferida" del panel: un
 * país entra si tiene al menos una obra marcada. Lo que cambia respecto de
 * `getPreferredByCountry` es con qué se llena el capítulo: las preferidas
 * primero y después el resto del archivo de ese país, hasta `perCountry`. Así
 * un país curado con una sola obra marcada no muestra una franja de uno.
 *
 * `total` es cuántas obras enlazables tiene ese país en el archivo, no cuántas
 * se muestran: es la cifra que va bajo el nombre del país, y sale de contar la
 * base, no de una promesa.
 *
 * `curatedOnly` es lo único que separa la portada de /destinations: la portada
 * muestra los países que el panel curó, y el índice completo muestra todos los
 * que tienen obra. La consulta y el armado son los mismos; cambiar solo el
 * filtro evita que las dos páginas puedan contar cosas distintas.
 */
export async function getCountryChapters(
  perCountry = 4,
  { curatedOnly = true }: { curatedOnly?: boolean } = {},
): Promise<CountryChapter[]> {
  try {
    const { rows } = await pool.query<PreferredPhoto & { preferida: boolean }>(
      `SELECT p.id, p.name, p.slug, p.images, p.pais, p.preferidos AS preferida,
              c.name AS "categoryName", c.slug AS "categorySlug"
       FROM photos p
       INNER JOIN categories c ON c.id = p.category_id
       WHERE p.pais IS NOT NULL
       ORDER BY p.preferidos DESC, p.id DESC`,
    );

    const byCountry = new Map<string, { photos: PreferredPhoto[]; total: number; curated: boolean }>();

    for (const row of rows) {
      const country = row.pais as string;
      const group = byCountry.get(country) ?? { photos: [], total: 0, curated: false };
      group.total += 1;
      group.curated ||= row.preferida;
      if (group.photos.length < perCountry) {
        group.photos.push(row);
      }
      byCountry.set(country, group);
    }

    return Array.from(byCountry, ([country, group]) => ({ country, ...group }))
      .filter((chapter) => (curatedOnly ? chapter.curated : true) && chapter.photos.length > 0)
      .sort(
        (a, b) =>
          countryRank(a.country) - countryRank(b.country) ||
          a.country.localeCompare(b.country, "es"),
      )
      .map(({ country, photos, total }) => ({ country, photos, total }));
  } catch {
    return [];
  }
}
