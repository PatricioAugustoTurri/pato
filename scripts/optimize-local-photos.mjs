/**
 * Las fotografías propias del sitio (no las del catálogo), listas para servir.
 *
 *   node scripts/optimize-local-photos.mjs
 *
 * Lee los originales de `src/assets/photos/` —que no se publican: son de
 * 4000×6000 y cualquiera podía bajarlos enteros desde /Pato/— y escribe en
 * `public/Pato/optimized/` cada uno en cinco anchos, en WebP. El loader de
 * imágenes (`src/lib/image-loader.ts`) elige el ancho que pide cada pantalla.
 *
 * Por qué de antemano y no al vuelo: el sitio usa un loader propio para que
 * Cloudinary sirva el catálogo desde su CDN, y con un loader propio Next apaga
 * su optimizador. Además, generarlas una vez acá es trabajo que el servidor no
 * hace nunca por visita.
 *
 * El nombre de cada archivo lleva un hash del original y de estos ajustes, así
 * que se pueden cachear para siempre: si la foto cambia, cambia el nombre. Para
 * reemplazar una foto alcanza con pisar el original y volver a correr esto.
 *
 * Para agregar una foto nueva: copiarla a `src/assets/photos/`, sumarla a
 * PHOTOS con la dirección con la que la nombra el componente, y correr esto.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src/assets/photos");
const OUT_DIR = path.join(ROOT, "public/Pato/optimized");
const MANIFEST = path.join(ROOT, "src/lib/local-photos.json");

/* La dirección que usa el componente → el archivo original. */
const PHOTOS = {
  "/Pato/_MG_7748.jpg": "_MG_7748.jpg", // portada (HeroSection)
  "/Pato/_MG_7669.jpg": "_MG_7669.jpg", // tapa de la tienda (ShopHero)
  "/Pato/R0000300.jpg": "R0000300.jpg", // franja de la historia en la portada (StorySection)
  "/Pato/R0000371.jpg": "R0000371.jpg", // tapa de la historia (StoryReader)
};

/* Anchos de imagen, no de CSS. 2560 es el techo: cubre un hero a pantalla
   completa en una retina de 1440 (2880 px reales) con una diferencia que el
   grano de la portada ya disimula, y pesa la mitad que un 3840. */
const WIDTHS = [640, 960, 1280, 1920, 2560];
/* WebP y no AVIF: un archivo sirve a un solo formato y WebP lo entiende todo
   navegador vigente; un AVIF dejaría sin portada a los Safari anteriores a 16.4. */
const WEBP = { quality: 80, effort: 6, smartSubsample: true };

await mkdir(OUT_DIR, { recursive: true });

const manifest = {};
const keep = new Set();

for (const [key, file] of Object.entries(PHOTOS)) {
  const source = await readFile(path.join(SOURCE_DIR, file));
  const hash = createHash("sha256")
    .update(source)
    .update(JSON.stringify({ WIDTHS, WEBP }))
    .digest("hex")
    .slice(0, 10);
  const base = path.parse(file).name;
  const { width: sourceWidth } = await sharp(source).metadata();
  /* Nunca agrandar: si el original es más angosto que un ancho, ese ancho no
     existe y el loader cae al más grande que sí. */
  const widths = WIDTHS.filter((w) => w <= sourceWidth);
  if (widths.length === 0) widths.push(sourceWidth);

  let total = 0;
  for (const width of widths) {
    const name = `${base}-${width}.${hash}.webp`;
    keep.add(name);
    const out = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp(WEBP).toBuffer();
    await writeFile(path.join(OUT_DIR, name), out);
    total += out.length;
  }

  manifest[key] = { base, hash, widths };
  console.log(
    `${file}: ${(source.length / 1024).toFixed(0)} KB original → ${widths.length} anchos, ${(total / 1024).toFixed(0)} KB en total`,
  );
}

/* Lo que quedó de una corrida anterior —otra versión de una foto, otros
   ajustes— se borra: nadie lo pide y viajaría en cada imagen de Docker. */
for (const name of await readdir(OUT_DIR)) {
  if (!keep.has(name)) await unlink(path.join(OUT_DIR, name));
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Manifiesto: ${path.relative(ROOT, MANIFEST)}`);
