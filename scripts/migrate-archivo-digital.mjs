import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-archivo-digital.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/*
 * El archivo digital: el JPG original de cada obra, que se vende como aporte al
 * viaje y se descarga apenas Stripe confirma el pago.
 *
 * El archivo NO vive en la base ni en Cloudinary. La cuenta gratis de Cloudinary
 * no acepta más de 10 MB por imagen, y las fotos del catálogo son públicas: la
 * firma "PT" va en la URL y alcanza con sacarla para bajar la foto entera. El
 * original vive en un volumen del servidor (ORIGINALS_DIR) y acá se guarda solo
 * qué archivo es y cuánto mide, para que la ficha sepa si la obra se vende en
 * digital y el panel pueda decir hasta qué tamaño se imprime bien.
 *
 * Corre en cada deploy desde el Dockerfile. Es idempotente: solo agrega lo que
 * falte.
 */
await pool.query(`
  ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS original_file text,
    ADD COLUMN IF NOT EXISTS original_bytes bigint,
    ADD COLUMN IF NOT EXISTS original_width integer,
    ADD COLUMN IF NOT EXISTS original_height integer,
    ADD COLUMN IF NOT EXISTS original_uploaded_at timestamptz
`);

/*
 * Un permiso de descarga por obra comprada. El token es la llave: largo,
 * aleatorio, y lo único que viaja en el mail. Vence por fecha y por cantidad de
 * descargas, para que un link reenviado no sea una copia gratis para siempre.
 */
await pool.query(`
  CREATE TABLE IF NOT EXISTS digital_downloads (
    id bigserial PRIMARY KEY,
    order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    photo_id bigint NOT NULL,
    token text NOT NULL UNIQUE,
    downloads integer NOT NULL DEFAULT 0,
    max_downloads integer NOT NULL,
    expires_at timestamptz NOT NULL,
    last_downloaded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (order_id, photo_id)
  )
`);

console.log("Archivo digital: columnas de `photos` y tabla `digital_downloads` al día.");

await pool.end();
