import { Pool } from "pg";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/update-photos-from-fotos-json.mjs",
  );
  process.exit(1);
}

// Por defecto toma Desktop/fotos.json (un nivel arriba del proyecto).
// Se puede pasar otra ruta: node ... scripts/update-photos-from-fotos-json.mjs /ruta/a/otro.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const positionalArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
const jsonPath = positionalArgs[0]
  ? path.resolve(positionalArgs[0])
  : path.resolve(__dirname, "..", "..", "fotos.json");

const raw = await readFile(jsonPath, "utf-8");
const fotos = JSON.parse(raw);

if (!Array.isArray(fotos)) {
  console.error(`El archivo ${jsonPath} no contiene un array.`);
  process.exit(1);
}

console.log(`Leídas ${fotos.length} fotos desde ${jsonPath}`);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// UPSERT por id: si la foto ya existe la actualiza, si no existe la crea.
// created_at/updated_at se toman del JSON para no perder el historial real.
const upsertSql = `
  INSERT INTO photos (
    id, category_id, name, slug, description, oferta,
    images, stock, preferidos, pais, created_at, updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12
  )
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name        = EXCLUDED.name,
    slug        = EXCLUDED.slug,
    description = EXCLUDED.description,
    oferta      = EXCLUDED.oferta,
    images      = EXCLUDED.images,
    stock       = EXCLUDED.stock,
    preferidos  = EXCLUDED.preferidos,
    pais        = EXCLUDED.pais,
    updated_at  = EXCLUDED.updated_at
`;

// Los tamaños no viajan en el JSON porque no son de la obra: son los del
// catálogo, iguales para toda fotografía, y viven en src/lib/photo-variants.ts.
// Sin esto la foto entra pero queda sin precios, y la ficha no tiene qué vender.
const CATALOG_SIZES = [
  { size: "A4", price: 40 },
  { size: "A3", price: 55 },
  { size: "A2", price: 70 },
];

let inserted = 0;
let updated = 0;
let errors = 0;

const client = await pool.connect();
try {
  await client.query("BEGIN");

  for (const foto of fotos) {
    const existing = await client.query("SELECT id FROM photos WHERE id = $1", [foto.id]);
    const isUpdate = existing.rowCount > 0;

    try {
      await client.query(upsertSql, [
        foto.id,
        foto.category_id ?? null,
        foto.name,
        foto.slug,
        foto.description ?? null,
        foto.oferta ?? false,
        JSON.stringify(foto.images ?? []),
        foto.stock ?? 0,
        foto.preferidos ?? false,
        foto.pais ?? null,
        foto.created_at ?? new Date().toISOString(),
        foto.updated_at ?? new Date().toISOString(),
      ]);
      // El stock es el de la obra: se imprime por pedido, no hay inventario
      // por medida, así que los tres tamaños llevan el mismo número.
      for (const { size, price } of CATALOG_SIZES) {
        await client.query(
          `INSERT INTO photo_variants (photo_id, size, price, stock)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (photo_id, size)
           DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock`,
          [foto.id, size, price, foto.stock ?? 0],
        );
      }

      await client.query(
        `DELETE FROM photo_variants
         WHERE photo_id = $1 AND NOT (size = ANY($2::varchar[]))`,
        [foto.id, CATALOG_SIZES.map((variant) => variant.size)],
      );

      if (isUpdate) updated++; else inserted++;
    } catch (err) {
      errors++;
      console.error(`Error en foto id=${foto.id} (${foto.name}):`, err.message);
    }
  }

  // Mantiene la secuencia de ids sincronizada por si se insertaron filas nuevas.
  await client.query(
    `SELECT setval('photos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM photos))`,
  );
  await client.query(
    `SELECT setval('photo_variants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM photo_variants))`,
  );

  if (dryRun) {
    await client.query("ROLLBACK");
    console.log("\n--dry-run: no se guardó nada (ROLLBACK).");
  } else {
    await client.query("COMMIT");
  }

  console.log(`\nListo. Insertadas: ${inserted}, actualizadas: ${updated}, errores: ${errors}.`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Fallo general, se revirtió todo:", err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
