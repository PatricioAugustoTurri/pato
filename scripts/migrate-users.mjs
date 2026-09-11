import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-users.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'customer',
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);

await pool.query(`
  INSERT INTO users (name, email, password_hash, role)
  SELECT 'Administrador', email, password_hash, 'admin'
  FROM admin_users
  ON CONFLICT (email) DO NOTHING
`);

await pool.query(`
  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id)
`);

console.log("Migración de usuarios (cuentas + roles) aplicada.");
await pool.end();
