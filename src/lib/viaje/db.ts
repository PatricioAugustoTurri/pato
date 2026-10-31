import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { slugify } from "@/lib/viaje/slug";
import type {
  AdminDia,
  AdminMedio,
  AdminPais,
  AdminParada,
  Clima,
  DiaPayload,
  EstadoIngles,
  PaisPayload,
  Viaje,
  ViajeMedio,
} from "@/lib/viaje/types";

/* El número de día se cuenta desde el primer día cargado, sea borrador o no:
   es "días desde que salí", y un día de descanso sin entrada también cuenta.
   `fecha - fecha` en Postgres da días enteros. */
const NUMERO = `(d.fecha - (SELECT min(fecha) FROM viaje_dias)) + 1`;

type PaisRow = {
  id: number;
  slug: string;
  orden: number;
  nombre_es: string;
  nombre_en: string | null;
  nombre_local: string;
  lang_local: string;
  estado: AdminPais["estado"];
  cruce_es: string | null;
  cruce_en: string | null;
  resumen_es: string | null;
  resumen_en: string | null;
};

type ParadaRow = {
  pais_id: number;
  slug: string;
  nombre_es: string;
  nombre_en: string | null;
  nombre_local: string | null;
  lat: number;
  lon: number;
};

type DiaRow = {
  id: number;
  client_id: string;
  pais_id: number;
  numero: number;
  fecha: string;
  hora: string | null;
  desde: string | null;
  hasta: string | null;
  km: string | null;
  desnivel: number | null;
  lat: number | null;
  lon: number | null;
  lat_inicio: number | null;
  lon_inicio: number | null;
  clima: Clima | null;
  titulo_es: string;
  texto_es: string;
  titulo_en: string | null;
  texto_en: string | null;
  en_estado: EstadoIngles;
  en_fuente: string | null;
  publicado: boolean;
  actualizado: Date;
};

type MedioRow = {
  dia_id: number;
  client_id: string;
  tipo: AdminMedio["tipo"];
  url: string;
  public_id: string;
  ancho: number | null;
  alto: number | null;
  duracion: number | null;
  alt_es: string | null;
  alt_en: string | null;
  hora: string | null;
  lat: number | null;
  lon: number | null;
  camara: string | null;
  portada: boolean;
};

const toParada = (r: ParadaRow): AdminParada => ({
  slug: r.slug,
  es: r.nombre_es,
  en: r.nombre_en,
  local: r.nombre_local,
  lat: r.lat,
  lon: r.lon,
});

const toMedio = (r: MedioRow): AdminMedio => ({
  clientId: r.client_id,
  tipo: r.tipo,
  url: r.url,
  publicId: r.public_id,
  ancho: r.ancho,
  alto: r.alto,
  duracion: r.duracion,
  altEs: r.alt_es,
  altEn: r.alt_en,
  hora: r.hora,
  lat: r.lat,
  lon: r.lon,
  camara: r.camara,
  portada: r.portada,
});

/**
 * Lo que hay que traducir de un día, en una huella. Si la huella guardada al
 * traducir no coincide con la de ahora, el español cambió después: el inglés
 * quedó viejo.
 */
export function huellaEspanol(dia: Pick<DiaPayload, "tituloEs" | "textoEs" | "medios">): string {
  const texto = [dia.tituloEs, dia.textoEs, ...dia.medios.map((m) => m.altEs ?? "")].join("␞");
  return createHash("sha1").update(texto).digest("hex");
}

function toDia(r: DiaRow, medios: AdminMedio[]): AdminDia {
  return {
    id: r.id,
    clientId: r.client_id,
    paisId: r.pais_id,
    numero: r.numero,
    fecha: r.fecha,
    hora: r.hora,
    desde: r.desde,
    hasta: r.hasta,
    km: r.km === null ? null : Number(r.km),
    desnivel: r.desnivel,
    lat: r.lat,
    lon: r.lon,
    latInicio: r.lat_inicio,
    lonInicio: r.lon_inicio,
    clima: r.clima,
    tituloEs: r.titulo_es,
    textoEs: r.texto_es,
    tituloEn: r.titulo_en,
    textoEn: r.texto_en,
    enEstado: r.en_estado,
    enViejo: r.en_estado !== "sin" && r.en_fuente !== null && r.en_fuente !== huellaEspanol({
      tituloEs: r.titulo_es,
      textoEs: r.texto_es,
      medios,
    }),
    publicado: r.publicado,
    medios,
    actualizado: r.actualizado.toISOString(),
  };
}

const DIA_COLUMNS = `
  d.id, d.client_id, d.pais_id, ${NUMERO}::int AS numero, to_char(d.fecha, 'YYYY-MM-DD') AS fecha,
  d.hora, d.desde, d.hasta, d.km, d.desnivel, d.lat, d.lon, d.lat_inicio, d.lon_inicio, d.clima, d.titulo_es, d.texto_es, d.titulo_en,
  d.texto_en, d.en_estado, d.en_fuente, d.publicado, d.actualizado`;

async function readPaises(): Promise<AdminPais[]> {
  const [{ rows: paises }, { rows: paradas }] = await Promise.all([
    pool.query<PaisRow>("SELECT * FROM viaje_paises ORDER BY orden, id"),
    pool.query<ParadaRow>("SELECT * FROM viaje_paradas ORDER BY pais_id, orden, id"),
  ]);
  return paises.map((p) => ({
    id: p.id,
    slug: p.slug,
    orden: p.orden,
    es: p.nombre_es,
    en: p.nombre_en,
    local: p.nombre_local,
    localLang: p.lang_local,
    estado: p.estado,
    cruceEs: p.cruce_es,
    cruceEn: p.cruce_en,
    resumenEs: p.resumen_es,
    resumenEn: p.resumen_en,
    paradas: paradas.filter((s) => s.pais_id === p.id).map(toParada),
  }));
}

async function readDias(where = "TRUE", params: unknown[] = []): Promise<AdminDia[]> {
  const { rows } = await pool.query<DiaRow>(
    `SELECT ${DIA_COLUMNS} FROM viaje_dias d WHERE ${where} ORDER BY d.fecha DESC, d.hora DESC NULLS LAST, d.id DESC`,
    params,
  );
  if (rows.length === 0) return [];
  const { rows: medios } = await pool.query<MedioRow>(
    "SELECT * FROM viaje_medios WHERE dia_id = ANY($1) ORDER BY dia_id, orden, id",
    [rows.map((r) => r.id)],
  );
  return rows.map((r) => toDia(r, medios.filter((m) => m.dia_id === r.id).map(toMedio)));
}

export async function readParadas(): Promise<AdminParada[]> {
  const { rows } = await pool.query<ParadaRow>("SELECT * FROM viaje_paradas");
  return rows.map(toParada);
}

export async function readAdminViaje() {
  const [paises, dias] = await Promise.all([readPaises(), readDias()]);
  return { paises, dias };
}

export async function readDia(id: number): Promise<AdminDia | null> {
  const [dia] = await readDias("d.id = $1", [id]);
  return dia ?? null;
}

/* ——— Días ——— */

export type DiaGuardado = { dia: AdminDia; antes: { publicado: boolean } | null };

/**
 * Crea o actualiza un día por su `clientId`, con sus fotos y videos.
 *
 * Es idempotente a propósito: el teléfono puede mandar el mismo día dos veces
 * (se cortó la señal antes de la respuesta) y el resultado es el mismo. Los
 * medios que ya no vienen se borran de la base; los archivos quedan en
 * Cloudinary, que es más barato que perder una foto por un toque de más.
 *
 * El inglés solo se escribe desde acá si el autor lo revisó a mano. Si no, lo
 * que manda el teléfono puede ser una copia vieja, anterior a la traducción
 * automática, y la pisaría.
 */
export async function upsertDia(payload: DiaPayload): Promise<DiaGuardado> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: previo } = await client.query<{ id: number; publicado: boolean }>(
      "SELECT id, publicado FROM viaje_dias WHERE client_id = $1 FOR UPDATE",
      [payload.clientId],
    );
    const revisado = payload.enEstado === "revisado";
    const values = [
      payload.clientId,
      payload.paisId,
      payload.fecha,
      payload.hora,
      payload.desde,
      payload.hasta,
      payload.km,
      payload.desnivel,
      payload.lat,
      payload.lon,
      payload.tituloEs,
      payload.textoEs,
      payload.publicado,
      payload.latInicio,
      payload.lonInicio,
    ];
    let id: number;
    if (previo[0]) {
      id = previo[0].id;
      await client.query(
        `UPDATE viaje_dias SET pais_id = $2, fecha = $3, hora = $4, desde = $5, hasta = $6, km = $7,
           desnivel = $8, lat = $9, lon = $10, titulo_es = $11, texto_es = $12, publicado = $13,
           lat_inicio = $14, lon_inicio = $15, actualizado = now()
         WHERE client_id = $1`,
        values,
      );
    } else {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO viaje_dias (client_id, pais_id, fecha, hora, desde, hasta, km, desnivel, lat, lon,
           titulo_es, texto_es, publicado, lat_inicio, lon_inicio)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
        values,
      );
      id = rows[0].id;
    }

    if (revisado) {
      await client.query(
        `UPDATE viaje_dias SET titulo_en = $2, texto_en = $3, en_estado = 'revisado', en_fuente = $4 WHERE id = $1`,
        [id, payload.tituloEn, payload.textoEn, huellaEspanol(payload)],
      );
    }

    await guardarMedios(client, id, payload, revisado);
    await client.query("COMMIT");
    const dia = await readDia(id);
    return { dia: dia!, antes: previo[0] ? { publicado: previo[0].publicado } : null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function guardarMedios(client: PoolClient, diaId: number, payload: DiaPayload, revisado: boolean) {
  const ids = payload.medios.map((m) => m.clientId);
  await client.query("DELETE FROM viaje_medios WHERE dia_id = $1 AND NOT (client_id = ANY($2::uuid[]))", [diaId, ids]);

  for (const [orden, m] of payload.medios.entries()) {
    await client.query(
      `INSERT INTO viaje_medios (client_id, dia_id, orden, tipo, url, public_id, ancho, alto, duracion,
         alt_es, alt_en, hora, lat, lon, camara, portada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (client_id) DO UPDATE SET
         dia_id = EXCLUDED.dia_id, orden = EXCLUDED.orden, tipo = EXCLUDED.tipo, url = EXCLUDED.url,
         public_id = EXCLUDED.public_id, ancho = EXCLUDED.ancho, alto = EXCLUDED.alto,
         duracion = EXCLUDED.duracion, alt_es = EXCLUDED.alt_es,
         alt_en = CASE WHEN $17 THEN EXCLUDED.alt_en ELSE viaje_medios.alt_en END,
         hora = EXCLUDED.hora, lat = EXCLUDED.lat, lon = EXCLUDED.lon, camara = EXCLUDED.camara,
         portada = EXCLUDED.portada`,
      [
        m.clientId, diaId, orden, m.tipo, m.url, m.publicId, m.ancho, m.alto, m.duracion,
        m.altEs, m.altEn, m.hora, m.lat, m.lon, m.camara, m.portada, revisado,
      ],
    );
  }

  // Una sola portada por país: la que se acaba de marcar desplaza a las otras.
  const portada = payload.medios.find((m) => m.portada);
  if (portada) {
    await client.query(
      `UPDATE viaje_medios SET portada = false
       WHERE portada AND client_id <> $1
         AND dia_id IN (SELECT id FROM viaje_dias WHERE pais_id = $2)`,
      [portada.clientId, payload.paisId],
    );
  }
}

export async function guardarTraduccion(
  id: number,
  traduccion: { titulo: string; texto: string; alts: Record<string, string> },
  fuente: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE viaje_dias SET titulo_en = $2, texto_en = $3, en_estado = 'auto', en_fuente = $4 WHERE id = $1`,
      [id, traduccion.titulo, traduccion.texto, fuente],
    );
    for (const [clientId, alt] of Object.entries(traduccion.alts)) {
      await client.query("UPDATE viaje_medios SET alt_en = $2 WHERE client_id = $1 AND dia_id = $3", [clientId, alt, id]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lo que el servidor completa solo después de guardar: el nombre de los lugares (si el
 * autor no escribió nada) y el clima. Nunca pisa lo que el autor escribió a mano.
 */
export async function guardarDatosAuto(
  id: number,
  datos: { desde?: string | null; hasta?: string | null; clima?: Clima | null },
) {
  await pool.query(
    `UPDATE viaje_dias SET
       desde = COALESCE(desde, $2),
       hasta = COALESCE(hasta, $3),
       clima = COALESCE($4::jsonb, clima)
     WHERE id = $1`,
    [id, datos.desde ?? null, datos.hasta ?? null, datos.clima ? JSON.stringify(datos.clima) : null],
  );
}

export async function deleteDia(id: number): Promise<{ publicado: boolean } | null> {
  const { rows } = await pool.query<{ publicado: boolean }>(
    "DELETE FROM viaje_dias WHERE id = $1 RETURNING publicado",
    [id],
  );
  return rows[0] ?? null;
}

/* ——— Países ——— */

function paisValues(p: PaisPayload) {
  return [
    p.es.trim(),
    p.en?.trim() || null,
    p.local.trim() || p.es.trim(),
    p.localLang.trim() || "es",
    p.estado,
    p.cruceEs?.trim() || null,
    p.cruceEn?.trim() || null,
    p.resumenEs?.trim() || null,
    p.resumenEn?.trim() || null,
  ];
}

async function guardarParadas(client: PoolClient, paisId: number, paradas: AdminParada[]) {
  await client.query("DELETE FROM viaje_paradas WHERE pais_id = $1", [paisId]);
  const usados = new Set<string>();
  for (const [orden, s] of paradas.entries()) {
    let slug = s.slug?.trim() || slugify(s.es);
    while (usados.has(slug)) slug = `${slug}-${orden}`;
    usados.add(slug);
    await client.query(
      `INSERT INTO viaje_paradas (pais_id, orden, slug, nombre_es, nombre_en, nombre_local, lat, lon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [paisId, orden, slug, s.es.trim(), s.en?.trim() || null, s.local?.trim() || null, s.lat, s.lon],
    );
  }
}

/**
 * Un país nuevo entra donde le corresponde por longitud: el orden de la página
 * es de este a oeste, así que si tiene paradas se ubica solo. Sin paradas va
 * al final, y se mueve a mano.
 */
export async function createPais(payload: PaisPayload): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const slug = payload.slug?.trim() || slugify(payload.es);
    const lon = payload.paradas[0]?.lon;
    let orden: number;
    if (typeof lon === "number") {
      const { rows } = await client.query<{ orden: number | null }>(
        `SELECT min(p.orden) AS orden FROM viaje_paises p
         WHERE (SELECT s.lon FROM viaje_paradas s WHERE s.pais_id = p.id ORDER BY s.orden LIMIT 1) < $1`,
        [lon],
      );
      orden = rows[0].orden ?? Number.MAX_SAFE_INTEGER;
    } else {
      orden = Number.MAX_SAFE_INTEGER;
    }
    await client.query("UPDATE viaje_paises SET orden = orden + 1 WHERE orden >= $1", [orden]);
    const { rows: [{ max }] } = await client.query<{ max: number | null }>("SELECT max(orden) AS max FROM viaje_paises");
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO viaje_paises (slug, orden, nombre_es, nombre_en, nombre_local, lang_local, estado,
         cruce_es, cruce_en, resumen_es, resumen_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [slug, Math.min(orden, (max ?? -1) + 1), ...paisValues(payload)],
    );
    await guardarParadas(client, rows[0].id, payload.paradas);
    await client.query("COMMIT");
    return rows[0].id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePais(id: number, payload: PaisPayload): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rowCount } = await client.query(
      `UPDATE viaje_paises SET nombre_es = $2, nombre_en = $3, nombre_local = $4, lang_local = $5,
         estado = $6, cruce_es = $7, cruce_en = $8, resumen_es = $9, resumen_en = $10, actualizado = now()
       WHERE id = $1`,
      [id, ...paisValues(payload)],
    );
    if (!rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await guardarParadas(client, id, payload.paradas);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Un país en curso deja a los demás en curso como recorridos: se está en un solo lugar. */
export async function setEstadoPais(id: number, estado: AdminPais["estado"]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (estado === "en_curso") {
      await client.query(
        "UPDATE viaje_paises SET estado = 'recorrido', actualizado = now() WHERE estado = 'en_curso' AND id <> $1",
        [id],
      );
    }
    const { rowCount } = await client.query(
      "UPDATE viaje_paises SET estado = $2, actualizado = now() WHERE id = $1",
      [id, estado],
    );
    await client.query("COMMIT");
    return Boolean(rowCount);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePais(id: number): Promise<"ok" | "con-dias" | "no-existe"> {
  const { rows } = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM viaje_dias WHERE pais_id = $1", [id]);
  if (rows[0].n > 0) return "con-dias";
  const { rowCount } = await pool.query("DELETE FROM viaje_paises WHERE id = $1", [id]);
  return rowCount ? "ok" : "no-existe";
}

export async function reorderPaises(ids: number[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [orden, id] of ids.entries()) {
      await client.query("UPDATE viaje_paises SET orden = $2 WHERE id = $1", [id, orden]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* ——— Lo publicado ——— */

const toViajeMedio = (m: AdminMedio, conIngles: boolean): ViajeMedio => ({
  tipo: m.tipo,
  url: m.url,
  ancho: m.ancho,
  alto: m.alto,
  duracion: m.duracion,
  alt: { es: m.altEs, en: conIngles ? m.altEn : null },
  hora: m.hora,
  lat: m.lat,
  lon: m.lon,
  camara: m.camara,
});

/**
 * El viaje como lo ve el público: todos los países (la ruta entera se muestra
 * aunque falte recorrerla) y solo los días publicados, del más viejo al más
 * nuevo, que es como se lee un diario.
 */
export async function readViajePublico(): Promise<Viaje> {
  const [paises, dias] = await Promise.all([readPaises(), readDias("d.publicado")]);
  return {
    generado: new Date().toISOString(),
    paises: paises.map((p) => {
      const propios = dias.filter((d) => d.paisId === p.id).reverse();
      const medios = propios.flatMap((d) => d.medios);
      const portada = medios.find((m) => m.portada) ?? medios.find((m) => m.tipo === "foto") ?? null;
      const portadaDia = portada ? propios.find((d) => d.medios.includes(portada)) : undefined;
      return {
        slug: p.slug,
        es: p.es,
        en: p.en,
        local: p.local,
        localLang: p.localLang,
        estado: p.estado,
        cruce: p.cruceEs ? { es: p.cruceEs, en: p.cruceEn ?? p.cruceEs } : null,
        resumen: { es: p.resumenEs, en: p.resumenEn },
        portada: portada ? toViajeMedio(portada, portadaDia?.enEstado !== "sin") : null,
        paradas: p.paradas,
        dias: propios.map((d) => {
          const conIngles = d.enEstado !== "sin" && Boolean(d.tituloEn || d.textoEn);
          return {
            numero: d.numero,
            fecha: d.fecha,
            hora: d.hora,
            desde: d.desde,
            hasta: d.hasta,
            km: d.km,
            desnivel: d.desnivel,
            lat: d.lat,
            lon: d.lon,
            clima: d.clima,
            es: { titulo: d.tituloEs, texto: d.textoEs },
            en: conIngles
              ? { titulo: d.tituloEn ?? d.tituloEs, texto: d.textoEn ?? "", revisado: d.enEstado === "revisado" }
              : null,
            medios: d.medios.map((m) => toViajeMedio(m, conIngles)),
          };
        }),
      };
    }),
  };
}
