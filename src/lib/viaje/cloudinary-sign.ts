import { createHash } from "node:crypto";
import { CLOUDINARY_CLOUD_NAME } from "@/lib/cloudinary";

/**
 * Firma para que el teléfono suba fotos y videos directo a Cloudinary.
 *
 * El archivo no pasa por este servidor (un video de un minuto son decenas de
 * megas que el VPS no tiene por qué cargar): el panel pide una firma, y con
 * ella Cloudinary acepta la subida. La firma fija la carpeta y, para los
 * videos, la versión liviana que Cloudinary prepara apenas llega el original;
 * el teléfono no puede cambiar ni una cosa ni la otra.
 *
 * Necesita CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET (Settings → API Keys
 * en Cloudinary). El secreto nunca sale de acá.
 */

/** La versión de cada video que se ve en el sitio: H.264, 1080 de ancho como mucho. */
export const VIDEO_EAGER = "vc_h264,q_auto,w_1080,c_limit/mp4";

export const subidaDisponible = () =>
  Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export function firmarSubida(tipo: "foto" | "video", carpeta: string) {
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder: carpeta, timestamp };
  if (tipo === "video") {
    params.eager = VIDEO_EAGER;
    params.eager_async = "true";
  }
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(base + secret).digest("hex");
  return {
    url: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${tipo === "video" ? "video" : "image"}/upload`,
    fields: { ...params, api_key: apiKey, signature },
  };
}
