import type { AdminMedio, AdminParada, DiaPayload, EstadoIngles, EstadoPais, PaisPayload } from "@/lib/viaje/types";

/**
 * Lo que llega del panel, revisado campo por campo antes de tocar la base.
 *
 * Devuelve el payload limpio o el primer error en castellano, para mostrarlo
 * tal cual: desde la ruta, con poca señal, un "400" no le dice a nadie qué
 * corregir.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const lat = (v: unknown) => {
  const n = num(v);
  return n !== null && n >= -90 && n <= 90 ? n : null;
};
const lon = (v: unknown) => {
  const n = num(v);
  return n !== null && n >= -180 && n <= 180 ? n : null;
};
const hora = (v: unknown) => (typeof v === "string" && HORA.test(v) ? v : null);

export function parseDia(body: unknown): Result<DiaPayload> {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.clientId !== "string" || !UUID.test(b.clientId)) return { ok: false, error: "El día no tiene un identificador válido." };
  const paisId = Number(b.paisId);
  if (!Number.isInteger(paisId)) return { ok: false, error: "Elegí en qué país pasó este día." };
  if (typeof b.fecha !== "string" || !FECHA.test(b.fecha)) return { ok: false, error: "La fecha no es válida." };
  if (!Array.isArray(b.medios)) return { ok: false, error: "Las fotos y videos no llegaron bien." };

  const medios: AdminMedio[] = [];
  for (const raw of b.medios as Record<string, unknown>[]) {
    if (typeof raw.clientId !== "string" || !UUID.test(raw.clientId)) return { ok: false, error: "Una foto no tiene identificador." };
    if (raw.tipo !== "foto" && raw.tipo !== "video") return { ok: false, error: "Un archivo no es ni foto ni video." };
    if (typeof raw.url !== "string" || !raw.url.startsWith("https://res.cloudinary.com/")) {
      return { ok: false, error: "Hay una foto o un video que todavía no terminó de subir." };
    }
    if (typeof raw.publicId !== "string" || !raw.publicId) return { ok: false, error: "Una foto llegó sin su nombre en Cloudinary." };
    medios.push({
      clientId: raw.clientId,
      tipo: raw.tipo,
      url: raw.url,
      publicId: raw.publicId,
      ancho: num(raw.ancho),
      alto: num(raw.alto),
      duracion: num(raw.duracion),
      altEs: str(raw.altEs, 500),
      altEn: str(raw.altEn, 500),
      hora: hora(raw.hora),
      lat: lat(raw.lat),
      lon: lon(raw.lon),
      camara: str(raw.camara, 120),
      portada: raw.portada === true,
    });
  }

  const tituloEs = str(b.tituloEs, 200) ?? "";
  const textoEs = typeof b.textoEs === "string" ? b.textoEs.trim().slice(0, 40_000) : "";
  const publicado = b.publicado === true;
  if (publicado && !tituloEs && !textoEs && medios.length === 0) {
    return { ok: false, error: "Un día vacío no se puede publicar: escribí algo o sumá una foto." };
  }

  const enEstado = (["sin", "auto", "revisado"] as EstadoIngles[]).includes(b.enEstado as EstadoIngles)
    ? (b.enEstado as EstadoIngles)
    : undefined;

  return {
    ok: true,
    value: {
      clientId: b.clientId,
      paisId,
      fecha: b.fecha,
      hora: hora(b.hora),
      desde: str(b.desde),
      hasta: str(b.hasta),
      km: num(b.km),
      desnivel: num(b.desnivel) === null ? null : Math.round(num(b.desnivel)!),
      lat: lat(b.lat),
      lon: lon(b.lon),
      latInicio: lat(b.latInicio),
      lonInicio: lon(b.lonInicio),
      tituloEs,
      textoEs,
      tituloEn: str(b.tituloEn, 200),
      textoEn: typeof b.textoEn === "string" ? b.textoEn.trim().slice(0, 40_000) : null,
      enEstado,
      publicado,
      medios,
    },
  };
}

export function parsePais(body: unknown): Result<PaisPayload> {
  const b = (body ?? {}) as Record<string, unknown>;
  const es = str(b.es, 80);
  if (!es) return { ok: false, error: "El país necesita un nombre." };
  const estado = (["por_llegar", "en_curso", "recorrido"] as EstadoPais[]).includes(b.estado as EstadoPais)
    ? (b.estado as EstadoPais)
    : "por_llegar";
  if (!Array.isArray(b.paradas)) return { ok: false, error: "Las paradas no llegaron bien." };

  const paradas: AdminParada[] = [];
  for (const [i, raw] of (b.paradas as Record<string, unknown>[]).entries()) {
    const nombre = str(raw.es, 80);
    const la = lat(raw.lat);
    const lo = lon(raw.lon);
    if (!nombre) return { ok: false, error: `A la parada ${i + 1} le falta el nombre.` };
    if (la === null || lo === null) return { ok: false, error: `Las coordenadas de ${nombre} no son válidas.` };
    paradas.push({ slug: str(raw.slug, 80) ?? "", es: nombre, en: str(raw.en, 80), local: str(raw.local, 80), lat: la, lon: lo });
  }

  return {
    ok: true,
    value: {
      slug: str(b.slug, 80) ?? undefined,
      es,
      en: str(b.en, 80),
      local: str(b.local, 80) ?? es,
      localLang: str(b.localLang, 12) ?? "es",
      estado,
      cruceEs: str(b.cruceEs, 200),
      cruceEn: str(b.cruceEn, 200),
      resumenEs: typeof b.resumenEs === "string" ? b.resumenEs.trim().slice(0, 4000) || null : null,
      resumenEn: typeof b.resumenEn === "string" ? b.resumenEn.trim().slice(0, 4000) || null : null,
      paradas,
    },
  };
}
