import type { AdminDia, DiaPayload, EstadoSitio } from "@/lib/viaje/types";
import { store, type LocalDia, type LocalMedio } from "./store";

/**
 * Sube lo que está esperando en el teléfono: primero los archivos a
 * Cloudinary, uno por uno, después el día a la base.
 *
 * Corre cuando se guarda, cuando vuelve la señal y cada tanto mientras quede
 * algo pendiente. Cada archivo que termina se anota enseguida, así un corte a
 * mitad de camino no obliga a subir de nuevo lo que ya subió.
 *
 * Dos clases de error: sin señal (o el servidor caído) se reintenta solo; un
 * error que el servidor explica ("elegí un país") queda escrito en el día y
 * espera a que se corrija.
 */

export type Avance = { clientId: string; actual: number; total: number } | null;

type Evento =
  | { tipo: "cambio" }
  | { tipo: "guardado"; dia: AdminDia; sitio: EstadoSitio; avisoTraduccion: string | null }
  | { tipo: "avance"; avance: Avance };

/** Cuánto lleva subido cada archivo que está subiendo ahora, de 0 a 1. */
export const progresos = new Map<string, number>();

const listeners = new Set<(e: Evento) => void>();
export const escuchar = (fn: (e: Evento) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const emitir = (e: Evento) => listeners.forEach((fn) => fn(e));

class SinSenal extends Error {}
class Rechazado extends Error {}

const CHUNK = 6 * 1024 * 1024;

type Firma = { url: string; fields: Record<string, string | number> };
type Subido = { secure_url: string; public_id: string; width?: number; height?: number; duration?: number };

function enviar(url: string, form: FormData, headers: Record<string, string>, onProgress: (loaded: number) => void) {
  return new Promise<Subido & { done?: boolean }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      let body: (Subido & { error?: { message?: string } }) | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* sin cuerpo */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body) resolve(body);
      else if (xhr.status >= 500 || xhr.status === 0) reject(new SinSenal("Cloudinary no contestó."));
      else reject(new Rechazado(body?.error?.message ? `Cloudinary: ${body.error.message}` : `Cloudinary contestó ${xhr.status}.`));
    };
    xhr.onerror = () => reject(new SinSenal("Se cortó la conexión."));
    xhr.ontimeout = () => reject(new SinSenal("La subida tardó demasiado."));
    xhr.timeout = 10 * 60 * 1000;
    xhr.send(form);
  });
}

async function api<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  } catch {
    throw new SinSenal("Sin conexión.");
  }
  if (response.redirected && response.url.includes("/admin/login")) {
    throw new Rechazado("La sesión se cerró. Entrá de nuevo para seguir subiendo.");
  }
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (response.status === 401 || response.status === 403) {
    throw new Rechazado("La sesión se cerró. Entrá de nuevo para seguir subiendo.");
  }
  if (response.status >= 500) throw new SinSenal(body.error ?? "El servidor no contestó.");
  if (!response.ok) throw new Rechazado(body.error ?? `El servidor contestó ${response.status}.`);
  return body;
}

async function subirMedio(dia: LocalDia, medio: LocalMedio, paisSlug: string, onProgress: (p: number) => void) {
  const firma = await api<Firma>("/api/admin/viaje/firma", {
    method: "POST",
    body: JSON.stringify({ tipo: medio.tipo, pais: paisSlug }),
  });
  const archivo = medio.archivo!;
  const total = archivo.size;
  const campos = (parte: Blob) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(firma.fields)) form.append(k, String(v));
    form.append("file", parte, medio.nombre || (medio.tipo === "video" ? "video.mp4" : "foto.jpg"));
    return form;
  };

  if (total <= CHUNK) {
    return enviar(firma.url, campos(archivo), {}, (loaded) => onProgress(loaded / total));
  }

  // De a pedazos: un video de 80 MB en una sola petición no sobrevive a una señal floja.
  const uploadId = `${dia.clientId}-${medio.clientId}`;
  let resultado: Subido | null = null;
  for (let start = 0; start < total; start += CHUNK) {
    const end = Math.min(start + CHUNK, total);
    resultado = await enviar(
      firma.url,
      campos(archivo.slice(start, end)),
      { "X-Unique-Upload-Id": uploadId, "Content-Range": `bytes ${start}-${end - 1}/${total}` },
      (loaded) => onProgress((start + loaded) / total),
    );
  }
  return resultado!;
}

export function payloadDe(dia: LocalDia): DiaPayload {
  return {
    clientId: dia.clientId,
    paisId: dia.paisId,
    fecha: dia.fecha,
    hora: dia.hora,
    desde: dia.desde,
    hasta: dia.hasta,
    km: dia.km,
    desnivel: dia.desnivel,
    lat: dia.lat,
    lon: dia.lon,
    latInicio: dia.latInicio ?? null,
    lonInicio: dia.lonInicio ?? null,
    tituloEs: dia.tituloEs,
    textoEs: dia.textoEs,
    tituloEn: dia.tituloEn,
    textoEn: dia.textoEn,
    enEstado: dia.enEstado,
    publicado: dia.publicado,
    medios: dia.medios.map((m) => ({
      clientId: m.clientId,
      tipo: m.tipo,
      url: m.url!,
      publicId: m.publicId!,
      ancho: m.ancho,
      alto: m.alto,
      duracion: m.duracion,
      altEs: m.altEs,
      altEn: m.altEn,
      hora: m.hora,
      lat: m.lat,
      lon: m.lon,
      camara: m.camara,
      portada: m.portada,
    })),
  };
}

async function subirDia(clientId: string, paisSlug: (paisId: number) => string) {
  let dia = await store.dia(clientId);
  if (!dia || !dia.pendiente) return;
  const pendientes = dia.medios.filter((m) => !m.url);

  for (const [i, medio] of pendientes.entries()) {
    emitir({ tipo: "avance", avance: { clientId, actual: i + 1, total: pendientes.length } });
    const marcar = async (cambio: Partial<LocalMedio>) => {
      const actual = await store.dia(clientId);
      if (!actual) return;
      actual.medios = actual.medios.map((m) => (m.clientId === medio.clientId ? { ...m, ...cambio } : m));
      await store.guardar(actual);
      dia = actual;
      emitir({ tipo: "cambio" });
    };
    await marcar({ estado: "subiendo", progreso: 0, error: null });
    let ultimo = 0;
    try {
      const subido = await subirMedio(dia, medio, paisSlug(dia.paisId), (p) => {
        // No se escribe en IndexedDB en cada evento de progreso: queda en memoria.
        if (p - ultimo > 0.03 || p === 1) {
          ultimo = p;
          progresos.set(medio.clientId, p);
          emitir({ tipo: "cambio" });
        }
      });
      progresos.delete(medio.clientId);
      await marcar({
        estado: "listo",
        progreso: 1,
        url: subido.secure_url,
        publicId: subido.public_id,
        ancho: medio.ancho ?? subido.width ?? null,
        alto: medio.alto ?? subido.height ?? null,
        duracion: medio.duracion ?? subido.duration ?? null,
        archivo: null,
      });
    } catch (error) {
      progresos.delete(medio.clientId);
      await marcar({ estado: "error", error: (error as Error).message });
      throw error;
    }
  }

  emitir({ tipo: "avance", avance: null });
  dia = (await store.dia(clientId))!;
  const respuesta = await api<{ dia: AdminDia; sitio: EstadoSitio; avisoTraduccion: string | null }>(
    "/api/admin/viaje/dias",
    { method: "PUT", body: JSON.stringify(payloadDe(dia)) },
  );

  // Si se editó mientras subía, lo nuevo sigue pendiente y no se borra.
  const ahora = await store.dia(clientId);
  if (ahora && ahora.editado === dia.editado) await store.borrar(clientId);
  emitir({ tipo: "guardado", ...respuesta });
}

let corriendo = false;
let otraVez = false;

export async function sincronizar(paisSlug: (paisId: number) => string) {
  if (corriendo) {
    otraVez = true;
    return;
  }
  corriendo = true;
  try {
    do {
      otraVez = false;
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      const dias = (await store.dias()).filter((d) => d.pendiente && !d.error);
      for (const d of dias) {
        try {
          await subirDia(d.clientId, paisSlug);
        } catch (error) {
          emitir({ tipo: "avance", avance: null });
          if (error instanceof Rechazado) {
            const actual = await store.dia(d.clientId);
            if (actual) await store.guardar({ ...actual, error: error.message });
            emitir({ tipo: "cambio" });
            continue;
          }
          // Sin señal: se deja todo como está y se intenta más tarde.
          emitir({ tipo: "cambio" });
          return;
        }
      }
    } while (otraVez);
  } finally {
    corriendo = false;
  }
}

export const subiendo = () => corriendo;
