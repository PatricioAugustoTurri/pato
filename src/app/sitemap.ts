import type { MetadataRoute } from "next";
import { pool } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

/**
 * El mapa que Google usa para descubrir el catálogo.
 *
 * Sin esto, un buscador solo llega a una obra si va siguiendo enlaces desde la
 * portada hasta el tercer nivel, y las que están al fondo de una colección
 * pueden tardar semanas en aparecer o no aparecer nunca. Con el mapa, las 41
 * obras se ofrecen de una sola vez.
 */

/* El catálogo se edita desde el panel, no en un deploy: si el mapa se
   congelara al compilar, una obra nueva quedaría invisible para Google hasta la
   próxima subida. Una hora es suficiente para que aparezca sola sin volver a
   consultar la base en cada visita de un robot. */
export const revalidate = 3600;

/* Las páginas que existen siempre, con la prioridad puesta donde está el
   negocio: la portada y la tienda por encima de las condiciones de envío. */
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.9, changeFrequency: "weekly" },
  { path: "/destinations", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/shipping", priority: 0.4, changeFrequency: "yearly" },
  { path: "/returns", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

type CatalogRow = { path: string; updatedAt: Date };

/**
 * Colecciones y obras, con la fecha real de su última edición.
 *
 * `updated_at` sale de la base, no de `new Date()`: un mapa que jura que todo
 * cambió hace un segundo, cada vez que lo piden, es ruido que Google termina
 * ignorando. Acá la fecha significa algo.
 */
async function getCatalogRoutes(): Promise<CatalogRow[]> {
  try {
    const { rows } = await pool.query<CatalogRow>(`
      SELECT '/shop/' || slug AS path, updated_at AS "updatedAt"
      FROM categories
      UNION ALL
      SELECT '/shop/' || c.slug || '/' || p.slug AS path, p.updated_at AS "updatedAt"
      FROM photos p
      INNER JOIN categories c ON c.id = p.category_id
    `);
    return rows;
  } catch {
    /* Si la base no contesta, el mapa sale con las páginas fijas en vez de
       fallar entero: media respuesta correcta vale más que un 500 que hace que
       el robot desconfíe del archivo y tarde en volver a pedirlo. */
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const catalog = await getCatalogRoutes();

  return [
    ...STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...catalog.map(({ path, updatedAt }) => ({
      url: absoluteUrl(path),
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
      /* Una obra concreta es lo que alguien busca y lo que se vende; pesa más
         que cualquier página de condiciones y menos que la portada. */
      priority: path.split("/").length > 3 ? 0.8 : 0.9,
    })),
  ];
}
