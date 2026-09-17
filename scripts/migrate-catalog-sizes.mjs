import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-catalog-sizes.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/*
 * La lista de precios del catálogo, que hasta ahora vivía en `CATALOG_SIZES`,
 * dentro de `src/lib/photo-variants.ts`.
 *
 * Estaba en código porque los precios son uniformes para todo el catálogo: el
 * cliente elige el tamaño en la ficha y el administrador no lo carga por obra.
 * Eso no cambia — lo que cambia es dónde vive la lista. En código, subir A3 de
 * €55 a €60 era editar un archivo y esperar un deploy; acá es una fila.
 *
 * `position` y no el precio ni el alfabeto: el orden en que se leen los tamaños
 * es una decisión (de menor a mayor), y ordenar por precio la ataba a que el
 * más grande siempre sea el más caro.
 *
 * Las medidas NO están en esta tabla. Un A4 mide 21 × 29,7 cm en todo el mundo:
 * es un hecho del papel, no un precio que alguien decide, y vive en
 * `src/lib/sizes.ts` porque el carrito —que corre en el navegador, sobre lo que
 * quedó guardado en `localStorage`— también tiene que poder decirlo sin
 * preguntarle a la base. Una segunda copia editable a mano sería una medida que
 * puede quedar vieja en una de las dos pantallas sin que nadie se entere.
 */
await pool.query(`
  CREATE TABLE IF NOT EXISTS catalog_sizes (
    id bigserial PRIMARY KEY,
    size varchar(20) NOT NULL UNIQUE,
    price numeric(10,2) NOT NULL CHECK (price >= 0),
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`);

/* Se siembra con lo que ya estaba en el código, y solo si la tabla está vacía:
   correr esto dos veces no puede devolverle a nadie los precios viejos. */
const { rows } = await pool.query("SELECT count(*)::int AS total FROM catalog_sizes");

if (rows[0].total === 0) {
  await pool.query(
    `INSERT INTO catalog_sizes (size, price, position)
     VALUES ('A4', 40, 1), ('A3', 55, 2), ('A2', 70, 3)`,
  );
  console.log("Tabla `catalog_sizes` creada y sembrada con A4 €40 · A3 €55 · A2 €70.");
} else {
  console.log(`Tabla \`catalog_sizes\` ya tenía ${rows[0].total} tamaños. No se tocó.`);
}

await pool.end();
