import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-photos-pais.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Nullable a propósito: una obra sin país es un dato que falta, no un país
// vacío. La portada simplemente no la agrupa hasta que se le asigne uno.
await pool.query(`
  ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS pais varchar(80)
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS photos_pais_idx
    ON photos (pais) WHERE pais IS NOT NULL
`);

console.log("Columna `pais` agregada a photos.");
await pool.end();
