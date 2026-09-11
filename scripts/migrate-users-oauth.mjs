import { Pool } from "pg";

/**
 * Habilita las cuentas sin contraseña.
 *
 * Hasta acá toda cuenta nacía de un registro con email y contraseña, así que
 * `password_hash` era NOT NULL. Una cuenta creada al entrar con Google no tiene
 * contraseña y nunca la va a tener: el hash pasa a admitir NULL, y ese NULL es
 * el dato que dice "esta cuenta entra por Google". `authorize` de Credentials
 * rechaza a cualquier usuario sin hash, así que una cuenta de Google no se
 * puede tomar por la puerta de la contraseña.
 *
 * Es idempotente: correrlo dos veces no rompe nada.
 */

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-users-oauth.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);

const { rows } = await pool.query(
  `SELECT is_nullable FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'password_hash'`,
);

console.log(`password_hash admite NULL: ${rows[0]?.is_nullable === "YES" ? "sí" : "NO"}`);
await pool.end();
