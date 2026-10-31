import exifr from "exifr";
import type { LocalMedio } from "./store";

/**
 * Preparar una foto o un video en el teléfono, antes de subir nada.
 *
 * De cada foto se lee lo que la cámara anotó (cuándo, dónde, con qué) y se la
 * achica a 2560 px del lado largo: es más que lo que cualquier pantalla pide
 * en el diario y pesa una fracción, que es lo que importa con datos de roaming.
 * Los videos se suben como están, pero se revisa antes que no pasen el minuto.
 */

export const MAX_VIDEO_SEGUNDOS = 60;
/** El límite de Cloudinary para un video en el plan gratuito. */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const LADO_MAXIMO = 2560;

export type Leido = {
  fecha: string | null;
  hora: string | null;
  lat: number | null;
  lon: number | null;
  camara: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

async function leerExif(file: File): Promise<Leido> {
  const vacio: Leido = { fecha: null, hora: null, lat: null, lon: null, camara: null };
  try {
    const [tags, gps] = await Promise.all([
      exifr.parse(file, ["DateTimeOriginal", "CreateDate", "Make", "Model"]).catch(() => null),
      exifr.gps(file).catch(() => null),
    ]);
    // exifr arma la fecha como hora local del navegador a partir de la hora
    // local de la cámara: leyéndola con getHours() vuelve la hora del lugar.
    const cuando: Date | undefined = tags?.DateTimeOriginal ?? tags?.CreateDate;
    const valida = cuando instanceof Date && !Number.isNaN(cuando.getTime());
    const make = typeof tags?.Make === "string" ? tags.Make.trim() : "";
    const model = typeof tags?.Model === "string" ? tags.Model.trim() : "";
    return {
      fecha: valida ? `${cuando.getFullYear()}-${pad(cuando.getMonth() + 1)}-${pad(cuando.getDate())}` : null,
      hora: valida ? `${pad(cuando.getHours())}:${pad(cuando.getMinutes())}` : null,
      lat: Number.isFinite(gps?.latitude) ? gps!.latitude : null,
      lon: Number.isFinite(gps?.longitude) ? gps!.longitude : null,
      // "Apple iPhone 15" se lee mejor como "iPhone 15": el modelo ya suele traer la marca.
      camara: model ? (model.toLowerCase().startsWith(make.toLowerCase()) || !make ? model : `${make} ${model}`) : null,
    };
  } catch {
    return vacio;
  }
}

async function achicar(file: File): Promise<{ blob: Blob; ancho: number; alto: number } | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob ? { blob, ancho, alto } : null;
  } catch {
    // Un formato que este navegador no sabe dibujar (HEIC en una compu, por
    // ejemplo): se sube el original y Cloudinary lo convierte.
    return null;
  }
}

function metadatosVideo(file: Blob): Promise<{ duracion: number; ancho: number; alto: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      resolve({ duracion: video.duration, ancho: video.videoWidth, alto: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer el video."));
    };
    video.src = url;
  });
}

export type Preparado = { medio: LocalMedio; leido: Leido } | { error: string; nombre: string };

export async function preparar(file: File): Promise<Preparado> {
  const clientId = crypto.randomUUID();
  const base = {
    clientId,
    url: null,
    publicId: null,
    altEs: null,
    altEn: null,
    portada: false,
    nombre: file.name,
    estado: "local" as const,
    progreso: 0,
    error: null,
  };

  if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_BYTES) {
      return { nombre: file.name, error: `${file.name} pesa ${Math.round(file.size / 1048576)} MB y el máximo es 100. Grabalo en 1080p o recortalo.` };
    }
    let meta: { duracion: number; ancho: number; alto: number };
    try {
      meta = await metadatosVideo(file);
    } catch {
      return { nombre: file.name, error: `No se pudo abrir ${file.name}.` };
    }
    if (meta.duracion > MAX_VIDEO_SEGUNDOS + 0.5) {
      return {
        nombre: file.name,
        error: `${file.name} dura ${Math.round(meta.duracion)} s. Acá van videos de hasta un minuto; lo largo, a YouTube.`,
      };
    }
    const leido: Leido = { fecha: null, hora: null, lat: null, lon: null, camara: null };
    return {
      leido,
      medio: {
        ...base,
        tipo: "video",
        archivo: file,
        ancho: meta.ancho || null,
        alto: meta.alto || null,
        duracion: Math.round(meta.duracion * 10) / 10,
        hora: null,
        lat: null,
        lon: null,
        camara: null,
      },
    };
  }

  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    return { nombre: file.name, error: `${file.name} no es una foto ni un video.` };
  }

  const [leido, chico] = await Promise.all([leerExif(file), achicar(file)]);
  return {
    leido,
    medio: {
      ...base,
      tipo: "foto",
      archivo: chico?.blob ?? file,
      ancho: chico?.ancho ?? null,
      alto: chico?.alto ?? null,
      duracion: null,
      hora: leido.hora,
      lat: leido.lat,
      lon: leido.lon,
      camara: leido.camara,
    },
  };
}

/* ——— Cloudinary ——— */

const UPLOAD = "/upload/";

/** Una versión chica de lo que ya está subido, para las miniaturas del panel. */
export function miniatura(m: Pick<LocalMedio, "url" | "tipo">, ancho = 480): string | null {
  if (!m.url) return null;
  const at = m.url.indexOf(UPLOAD);
  if (at === -1) return m.url;
  const head = m.url.slice(0, at + UPLOAD.length);
  const tail = m.url.slice(at + UPLOAD.length).replace(/\.[a-z0-9]+$/i, "");
  return m.tipo === "video"
    ? `${head}so_0,w_${ancho},c_limit,q_auto/${tail}.jpg`
    : `${head}f_auto,q_auto,w_${ancho},c_limit/${tail}`;
}
