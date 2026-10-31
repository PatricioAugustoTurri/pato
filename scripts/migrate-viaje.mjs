import { readFile } from "node:fs/promises";
import { Pool } from "pg";

/**
 * El diario de viaje de Rumbo Oeste: países, paradas, días y sus fotos y videos.
 *
 *   node --env-file=.env.local scripts/migrate-viaje.mjs [viaje.json]
 *
 * Crea las tablas si no están. Si se le pasa un viaje.json (el de
 * `Vlog Pato/src/data/viaje.json`) y la tabla de países está vacía, la siembra
 * con la ruta tentativa. Con países ya cargados no toca nada: el panel manda.
 */

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. Corré con: node --env-file=.env.local scripts/migrate-viaje.mjs [viaje.json]");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  CREATE TABLE IF NOT EXISTS viaje_paises (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    orden integer NOT NULL,
    nombre_es text NOT NULL,
    nombre_en text,
    nombre_local text NOT NULL,
    lang_local text NOT NULL DEFAULT 'es',
    estado text NOT NULL DEFAULT 'por_llegar'
      CHECK (estado IN ('por_llegar', 'en_curso', 'recorrido')),
    cruce_es text,
    cruce_en text,
    resumen_es text,
    resumen_en text,
    creado timestamptz NOT NULL DEFAULT now(),
    actualizado timestamptz NOT NULL DEFAULT now()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS viaje_paradas (
    id serial PRIMARY KEY,
    pais_id integer NOT NULL REFERENCES viaje_paises (id) ON DELETE CASCADE,
    orden integer NOT NULL,
    slug text NOT NULL,
    nombre_es text NOT NULL,
    nombre_en text,
    nombre_local text,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    UNIQUE (pais_id, slug)
  )
`);

// client_id lo inventa el teléfono al crear el día, antes de tener señal. Es lo
// que hace que mandar dos veces el mismo día (un reintento después de un corte)
// lo actualice en vez de duplicarlo.
await pool.query(`
  CREATE TABLE IF NOT EXISTS viaje_dias (
    id serial PRIMARY KEY,
    client_id uuid NOT NULL UNIQUE,
    pais_id integer NOT NULL REFERENCES viaje_paises (id) ON DELETE RESTRICT,
    fecha date NOT NULL,
    hora text,
    desde text,
    hasta text,
    km numeric(7, 1),
    desnivel integer,
    lat double precision,
    lon double precision,
    titulo_es text NOT NULL DEFAULT '',
    texto_es text NOT NULL DEFAULT '',
    titulo_en text,
    texto_en text,
    en_estado text NOT NULL DEFAULT 'sin' CHECK (en_estado IN ('sin', 'auto', 'revisado')),
    en_fuente text,
    publicado boolean NOT NULL DEFAULT false,
    creado timestamptz NOT NULL DEFAULT now(),
    actualizado timestamptz NOT NULL DEFAULT now()
  )
`);
await pool.query(`CREATE INDEX IF NOT EXISTS viaje_dias_pais_fecha_idx ON viaje_dias (pais_id, fecha)`);

// Dónde arrancó el día (lat/lon de la tabla es dónde terminó) y el clima de ese lugar a esa
// hora. Se agregaron después: ALTER para las bases que ya tenían la tabla.
await pool.query(`
  ALTER TABLE viaje_dias
    ADD COLUMN IF NOT EXISTS lat_inicio double precision,
    ADD COLUMN IF NOT EXISTS lon_inicio double precision,
    ADD COLUMN IF NOT EXISTS clima jsonb
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS viaje_medios (
    id serial PRIMARY KEY,
    client_id uuid NOT NULL UNIQUE,
    dia_id integer NOT NULL REFERENCES viaje_dias (id) ON DELETE CASCADE,
    orden integer NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('foto', 'video')),
    url text NOT NULL,
    public_id text NOT NULL,
    ancho integer,
    alto integer,
    duracion real,
    alt_es text,
    alt_en text,
    hora text,
    lat double precision,
    lon double precision,
    camara text,
    portada boolean NOT NULL DEFAULT false
  )
`);
await pool.query(`CREATE INDEX IF NOT EXISTS viaje_medios_dia_idx ON viaje_medios (dia_id, orden)`);

console.log("Tablas del viaje listas.");

const seedPath = process.argv[2];
if (seedPath) {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM viaje_paises");
  if (rows[0].n > 0) {
    console.log(`Ya hay ${rows[0].n} países cargados: no se siembra nada.`);
  } else {
    const viaje = JSON.parse(await readFile(seedPath, "utf8"));
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const [i, p] of viaje.paises.entries()) {
        const { rows: [pais] } = await client.query(
          `INSERT INTO viaje_paises (slug, orden, nombre_es, nombre_en, nombre_local, lang_local, estado, cruce_es, cruce_en)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [p.slug, i, p.es, p.en, p.local, p.localLang, p.estado ?? "por_llegar", p.cruce?.es ?? null, p.cruce?.en ?? null],
        );
        for (const [j, s] of p.paradas.entries()) {
          await client.query(
            `INSERT INTO viaje_paradas (pais_id, orden, slug, nombre_es, nombre_en, nombre_local, lat, lon)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [pais.id, j, s.slug, s.es, s.en, s.local, s.lat, s.lon],
          );
        }
      }
      await client.query("COMMIT");
      console.log(`Sembrados ${viaje.paises.length} países desde ${seedPath}.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

await pool.end();
