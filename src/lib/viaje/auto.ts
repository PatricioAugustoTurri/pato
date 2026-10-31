import type { AdminDia, AdminParada, Clima } from "@/lib/viaje/types";

/**
 * Los datos de un día que no hace falta escribir: cómo se llama el lugar donde arrancó y
 * donde terminó (OpenStreetMap, a partir del GPS) y qué tiempo hacía (Open-Meteo, a partir
 * del lugar, la fecha y la hora). Los dos servicios son gratuitos y no piden clave.
 *
 * Corre en el servidor después de guardar, así funciona también con los días que el
 * teléfono escribió sin señal y subió más tarde. Si un servicio no contesta, el día queda
 * como estaba: es una ayuda, no un requisito.
 */

const UA = "RumboOeste/1.0 (https://patoturri.com)";
const lugares = new Map<string, string | null>();

/** El nombre de la ciudad o el pueblo más cercano a un punto, en castellano. */
export async function lugarDe(lat: number, lon: number): Promise<string | null> {
  const clave = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (lugares.has(clave)) return lugares.get(clave)!;
  try {
    // En castellano si OpenStreetMap lo tiene; si no, en inglés antes que en cirílico o en georgiano.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "es,en;q=0.8" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { name?: string; address?: Record<string, string> };
    const a = data.address ?? {};
    const nombre = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality ?? a.county ?? data.name ?? a.state ?? null;
    lugares.set(clave, nombre);
    return nombre;
  } catch {
    return null;
  }
}

/** El tiempo a esa hora en ese lugar. La hora es la local del lugar ("HH:MM"). */
export async function climaDe(lat: number, lon: number, fecha: string, hora: string | null): Promise<Clima | null> {
  // El pronóstico de Open-Meteo guarda los últimos ~90 días; lo anterior está en el archivo histórico.
  const dias = (Date.now() - Date.parse(`${fecha}T12:00:00Z`)) / 86_400_000;
  const base = dias > 80 ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const url =
    `${base}?latitude=${lat}&longitude=${lon}&start_date=${fecha}&end_date=${fecha}&timezone=auto` +
    "&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    const { hourly } = (await response.json()) as {
      hourly?: { time: string[]; temperature_2m: number[]; weather_code: number[]; wind_speed_10m: number[]; wind_direction_10m: number[] };
    };
    if (!hourly?.time?.length) return null;
    const h = Math.min(23, Math.round(Number((hora ?? "13:00").slice(0, 2)) + Number((hora ?? "13:00").slice(3, 5)) / 60));
    const i = Math.max(0, hourly.time.findIndex((t) => Number(t.slice(11, 13)) === h));
    const temp = hourly.temperature_2m[i];
    if (typeof temp !== "number") return null;
    return {
      temp: Math.round(temp),
      codigo: hourly.weather_code[i],
      viento: Math.round(hourly.wind_speed_10m[i]),
      direccion: Math.round(hourly.wind_direction_10m[i]),
    };
  } catch {
    return null;
  }
}

type Punto = { lat: number; lon: number };

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
const km = (a: Punto, b: Punto) => {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Si el punto está a menos de 20 km de una parada de la ruta, el nombre es el de la parada:
 * así el diario dice "Almaty", igual que la ruta, y no "Almatý" o el nombre del distrito.
 */
async function nombreDe(p: Punto, paradas: AdminParada[]) {
  const cerca = paradas.map((s) => ({ s, d: km(p, s) })).sort((a, b) => a.d - b.d)[0];
  if (cerca && cerca.d < 20) return cerca.s.es;
  return lugarDe(p.lat, p.lon);
}

/** Dónde arrancó y dónde terminó el día: el recorrido del GPS si se cargó, si no, las fotos. */
export function extremos(dia: AdminDia): { inicio: Punto | null; fin: Punto | null } {
  const conGps = dia.medios
    .filter((m) => m.lat !== null && m.lon !== null)
    .sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99"))
    .map((m) => ({ lat: m.lat!, lon: m.lon! }));
  const inicio = dia.latInicio !== null && dia.lonInicio !== null ? { lat: dia.latInicio, lon: dia.lonInicio } : conGps[0] ?? null;
  const fin = dia.lat !== null && dia.lon !== null ? { lat: dia.lat, lon: dia.lon } : conGps[conGps.length - 1] ?? null;
  return { inicio, fin };
}

/** Lo que falta completar de un día: lugares que el autor no escribió y el clima. */
export async function completar(dia: AdminDia, paradas: AdminParada[] = []) {
  const { inicio, fin } = extremos(dia);
  const cambios: { desde?: string | null; hasta?: string | null; clima?: Clima | null } = {};

  if (!dia.hasta && fin) cambios.hasta = await nombreDe(fin, paradas);
  if (!dia.desde && inicio) {
    // Nominatim pide no más de una consulta por segundo.
    if (cambios.hasta !== undefined) await new Promise((r) => setTimeout(r, 1100));
    const desde = await nombreDe(inicio, paradas);
    // Un día de descanso en el mismo pueblo no es "Osh → Osh".
    if (desde && desde !== (dia.hasta ?? cambios.hasta)) cambios.desde = desde;
  }
  const punto = fin ?? inicio;
  if (!dia.clima && punto) cambios.clima = await climaDe(punto.lat, punto.lon, dia.fecha, dia.hora);

  const hay = Object.values(cambios).some((v) => v);
  return hay ? cambios : null;
}
