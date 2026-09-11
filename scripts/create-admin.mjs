import { Pool } from "pg";
import bcrypt from "bcryptjs";

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error(
    "Uso: node --env-file=.env.local scripts/create-admin.mjs <email> <password> [nombre]",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré el script con --env-file=.env.local, ej:\n" +
      "node --env-file=.env.local scripts/create-admin.mjs <email> <password> [nombre]",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const passwordHash = await bcrypt.hash(password, 12);

await pool.query(
  `INSERT INTO users (name, email, password_hash, role)
   VALUES ($1, $2, $3, 'admin')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
  [name?.trim() || "Administrador", email.trim().toLowerCase(), passwordHash],
);

console.log(`Usuario admin listo: ${email}`);
await pool.end();
