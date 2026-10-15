import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-password-resets.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/* Un enlace de recuperación por fila. Se guarda el hash del token, nunca el
   token: quien lea la base no puede usar los enlaces que estén vigentes. */
await pool.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);

await pool.query(
  `CREATE INDEX IF NOT EXISTS password_resets_user_id_idx ON password_resets (user_id)`,
);

console.log("Migración de password_resets aplicada.");
await pool.end();
