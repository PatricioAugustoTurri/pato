import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-orders-shipping.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_name text,
    ADD COLUMN IF NOT EXISTS customer_phone text,
    ADD COLUMN IF NOT EXISTS shipping_address jsonb,
    ADD COLUMN IF NOT EXISTS shipping_option text,
    ADD COLUMN IF NOT EXISTS shipping_amount_cents integer,
    ADD COLUMN IF NOT EXISTS amount_total_cents integer
`);

console.log("Migración de orders (comprador/envío) aplicada.");
await pool.end();
