import { distanciaKm } from "./geo";

/**
 * El recorrido del día desde el archivo del Garmin o el Wahoo (.fit o .gpx): de ahí salen
 * los km, el desnivel, la hora de salida y dónde arrancó y terminó el día.
 *
 * Se lee en el teléfono, sin subir el archivo a ningún lado y sin necesitar señal. Si el
 * archivo trae los totales que calculó el aparato (los .fit), se usan esos; si no, se
 * calculan con los puntos.
 */

export type Recorrido = {
  fecha: string;
  hora: string;
  km: number;
  desnivel: number | null;
  inicio: { lat: number; lon: number };
  fin: { lat: number; lon: number };
};

type Punto = { lat: number; lon: number; ele: number | null; t: Date | null };

const pad = (n: number) => String(n).padStart(2, "0");
const SEMICIRCULO = 180 / 2 ** 31;

/** Sube acumulada con un umbral, para que el ruido del GPS no sume metros que no existen. */
function subida(puntos: Punto[]) {
  let total = 0;
  let base: number | null = null;
  for (const p of puntos) {
    if (p.ele === null) continue;
    if (base === null) base = p.ele;
    else if (p.ele - base >= 3) {
      total += p.ele - base;
      base = p.ele;
    } else if (p.ele < base) base = p.ele;
  }
  return Math.round(total);
}

function armar(puntos: Punto[], totales: { km?: number; desnivel?: number; inicio?: Date } = {}): Recorrido {
  const validos = puntos.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && (p.lat !== 0 || p.lon !== 0));
  if (validos.length < 2) throw new Error("El archivo no tiene un recorrido con GPS.");
  const km =
    totales.km ?? validos.slice(1).reduce((s, p, i) => s + distanciaKm(validos[i], p), 0);
  const inicio = totales.inicio ?? validos.find((p) => p.t)?.t ?? null;
  if (!inicio) throw new Error("El archivo no dice a qué hora salió.");
  return {
    // La hora del teléfono es la del lugar donde estás: así se lee la salida en hora local.
    fecha: `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`,
    hora: `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`,
    km: Math.round(km * 10) / 10,
    desnivel: totales.desnivel ?? (validos.some((p) => p.ele !== null) ? subida(validos) : null),
    inicio: { lat: validos[0].lat, lon: validos[0].lon },
    fin: { lat: validos[validos.length - 1].lat, lon: validos[validos.length - 1].lon },
  };
}

function leerGpx(texto: string): Recorrido {
  const doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("El archivo .gpx está dañado.");
  const nodos = [...doc.getElementsByTagName("trkpt"), ...doc.getElementsByTagName("rtept")];
  const puntos = nodos.map((n) => {
    const ele = n.getElementsByTagName("ele")[0]?.textContent;
    const time = n.getElementsByTagName("time")[0]?.textContent;
    return {
      lat: Number(n.getAttribute("lat")),
      lon: Number(n.getAttribute("lon")),
      ele: ele ? Number(ele) : null,
      t: time ? new Date(time) : null,
    };
  });
  return armar(puntos);
}

async function leerFit(bytes: Uint8Array): Promise<Recorrido> {
  const { Decoder, Stream } = await import("@garmin/fitsdk");
  const decoder = new Decoder(Stream.fromByteArray(Array.from(bytes)));
  if (!decoder.isFIT()) throw new Error("El archivo no es un .fit válido.");
  const { messages } = decoder.read();
  type Record = { positionLat?: number; positionLong?: number; enhancedAltitude?: number; altitude?: number; timestamp?: Date };
  type Session = { totalDistance?: number; totalAscent?: number; startTime?: Date };
  const records = ((messages as { recordMesgs?: Record[] }).recordMesgs ?? []);
  const session = ((messages as { sessionMesgs?: Session[] }).sessionMesgs ?? [])[0];
  const puntos = records
    .filter((r) => typeof r.positionLat === "number" && typeof r.positionLong === "number")
    .map((r) => ({
      lat: r.positionLat! * SEMICIRCULO,
      lon: r.positionLong! * SEMICIRCULO,
      ele: r.enhancedAltitude ?? r.altitude ?? null,
      t: r.timestamp ?? null,
    }));
  return armar(puntos, {
    km: typeof session?.totalDistance === "number" ? session.totalDistance / 1000 : undefined,
    desnivel: typeof session?.totalAscent === "number" ? session.totalAscent : undefined,
    inicio: session?.startTime,
  });
}

export const esRecorrido = (file: File) => /\.(fit|gpx)$/i.test(file.name);

export async function leerRecorrido(file: File): Promise<Recorrido> {
  if (/\.gpx$/i.test(file.name)) return leerGpx(await file.text());
  if (/\.fit$/i.test(file.name)) return leerFit(new Uint8Array(await file.arrayBuffer()));
  throw new Error("Solo se leen archivos .fit o .gpx.");
}
