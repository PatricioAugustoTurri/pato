import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-photos-preferidos.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// NOT NULL con DEFAULT false: sin el NOT NULL aparecería un tercer estado
// (nulo) que en la práctica significa lo mismo que false pero obliga a
// contemplarlo en cada consulta. Mismo criterio que la columna `oferta`.
await pool.query(`
  ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS preferidos boolean NOT NULL DEFAULT false
`);

// Índice parcial: las consultas van a pedir siempre las preferidas, que son
// pocas. Indexar solo esas filas es más chico y más rápido que la columna entera.
await pool.query(`
  CREATE INDEX IF NOT EXISTS photos_preferidos_idx
    ON photos (id) WHERE preferidos
`);

console.log("Columna `preferidos` agregada a photos.");
await pool.end();
