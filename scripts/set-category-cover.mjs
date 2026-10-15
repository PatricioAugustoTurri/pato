/**
 * Pone una obra del catálogo como portada de una colección.
 *
 *   node --env-file=.env.local scripts/set-category-cover.mjs city Between-the-Eaves
 *   node --env-file=.env.local scripts/set-category-cover.mjs city 64
 *
 * Existe como script y no como un `UPDATE` a mano por dos razones.
 *
 * La primera es que `categories` no tiene interfaz en el panel: las portadas de
 * las cuatro colecciones solo se pueden cambiar contra la base, y escribir la
 * sentencia de memoria cada vez es la forma más rápida de romper el formato.
 *
 * La segunda es ese formato. `categories.images` NO guarda la misma forma que
 * `photos.images`: la primera usa `[["url"]]` —un array dentro de otro— y la
 * segunda `[{ "url": ..., "alt": ... }]`. `normalizePhotoImage` acepta las dos,
 * pero `normalizeCategoryImage` en `ShopRoom.tsx` solo entiende la anidada, así
 * que copiar el objeto de la foto tal cual deja /shop/<colección> con su portada
 * y /shop sin ninguna, sin un solo error en consola. Este script escribe siempre
 * la forma anidada, que es la que funciona en las dos pantallas.
 */
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/set-category-cover.mjs <colección> <obra>",
  );
  process.exit(1);
}

const [categorySlug, photoRef] = process.argv.slice(2);

if (!categorySlug || !photoRef) {
  console.error("uso: set-category-cover.mjs <slug-de-colección> <slug-o-id-de-obra>");
  console.error("ej.: set-category-cover.mjs city Between-the-Eaves");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const { rows: categories } = await pool.query(
  "SELECT id, name, slug, images FROM categories WHERE slug = $1",
  [categorySlug],
);

if (categories.length === 0) {
  console.error(`No existe la colección «${categorySlug}».`);
  await pool.end();
  process.exit(1);
}

const category = categories[0];

/* Se acepta el slug o el id porque el slug de una obra puede venir con
   mayúsculas («Between-the-Eaves») y es fácil errarle; el id sale de la lista
   del panel y no tiene ambigüedad. */
const byId = /^\d+$/.test(photoRef);
const { rows: photos } = await pool.query(
  `SELECT p.id, p.name, p.images, c.name AS coleccion, c.slug AS coleccion_slug
     FROM photos p
     LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${byId ? "p.id = $1" : "p.slug = $1"}`,
  [byId ? Number(photoRef) : photoRef],
);

if (photos.length === 0) {
  console.error(`No existe la obra «${photoRef}».`);
  await pool.end();
  process.exit(1);
}

const photo = photos[0];
const url = Array.isArray(photo.images) ? photo.images[0]?.url : undefined;

if (typeof url !== "string" || !url) {
  console.error(`La obra «${photo.name}» no tiene imagen cargada.`);
  await pool.end();
  process.exit(1);
}

/* Una portada de otra colección se avisa pero no se bloquea: es raro, y podría
   ser deliberado, pero no debería pasar por accidente y en silencio. */
if (photo.coleccion_slug !== category.slug) {
  console.warn(
    `Aviso: «${photo.name}» está en ${photo.coleccion ?? "ninguna colección"}, no en ${category.name}.`,
  );
}

const antes = Array.isArray(category.images) ? category.images[0]?.[0] : undefined;

await pool.query("UPDATE categories SET images = $1::jsonb, updated_at = now() WHERE id = $2", [
  JSON.stringify([[url]]),
  category.id,
]);

console.log(`Portada de ${category.name}:`);
console.log(`  antes   ${antes ?? "(ninguna)"}`);
console.log(`  ahora   ${url}`);
console.log(`  obra    ${photo.name} (id ${photo.id})`);

await pool.end();
