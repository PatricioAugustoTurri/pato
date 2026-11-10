import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomBytes } from "node:crypto";
import { MAX_ORIGINAL_BYTES } from "@/lib/digital";

/**
 * Los JPG originales que se venden como archivo digital, en el disco del
 * servidor.
 *
 * No están en Cloudinary: la cuenta gratis corta en 10 MB por imagen, y lo que
 * hay ahí es público. Acá viven en ORIGINALS_DIR, que en producción es un
 * volumen persistente de Coolify montado en /app/data/originales. Sin volumen,
 * cada deploy arranca un contenedor nuevo y los originales desaparecen; por eso
 * en producción la variable es obligatoria y subir un original sin ella falla
 * con un mensaje, en vez de guardar algo que se va a perder en el próximo push.
 */
export function originalsDir(): string | null {
  const fromEnv = process.env.ORIGINALS_DIR?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return null;
  return path.join(process.cwd(), "data", "originales");
}

/** El camino de un archivo, sin dejar que un nombre raro salga de la carpeta. */
export function originalPath(file: string): string | null {
  const dir = originalsDir();
  if (!dir || !/^[a-z0-9-]+\.jpg$/.test(file)) return null;
  return path.join(dir, file);
}

export class OriginalError extends Error {}

/**
 * Lee el ancho y el alto de un JPG recorriendo sus segmentos hasta el SOF
 * (Start Of Frame), que es donde el archivo dice cuánto mide. El EXIF puede
 * mentir —un recorte en Lightroom no siempre lo actualiza—; el SOF no.
 */
export function jpegSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];

    /* Relleno entre segmentos: un 0xFF seguido de otro 0xFF. */
    if (marker === 0xff) {
      offset += 1;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);
    /* SOF0–SOF15, salvo DHT (C4), JPG (C8) y DAC (CC), que comparten el rango. */
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

/**
 * Guarda un original que llega como stream —el cuerpo de la petición tal cual,
 * sin pasar por la memoria— y devuelve cómo quedó. Escribe primero a un archivo
 * temporal y lo renombra al final: si la subida se corta, el original anterior
 * sigue entero.
 */
export async function saveOriginal(
  slug: string,
  body: ReadableStream<Uint8Array>,
): Promise<{ file: string; bytes: number; width: number; height: number }> {
  const dir = originalsDir();
  if (!dir) {
    throw new OriginalError(
      "Falta ORIGINALS_DIR en el servidor: sin un volumen persistente los originales se borran en el próximo deploy.",
    );
  }
  await mkdir(dir, { recursive: true });

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "obra";
  /* Un sufijo aleatorio: el nombre no se adivina, y reemplazar un original no
     pisa el archivo que alguien puede estar bajando en ese momento. */
  const file = `${safeSlug}-${randomBytes(6).toString("hex")}.jpg`;
  const finalPath = path.join(dir, file);
  const tempPath = `${finalPath}.part`;

  let bytes = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > MAX_ORIGINAL_BYTES) {
        callback(new OriginalError(`El archivo pasa de ${MAX_ORIGINAL_BYTES / 1024 / 1024} MB.`));
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>),
      limit,
      createWriteStream(tempPath),
    );

    /* Las medidas están en los primeros segmentos; 2 MB alcanzan aun con un
       EXIF largo y un perfil de color embebido. */
    const handle = await open(tempPath, "r");
    const head = Buffer.alloc(Math.min(bytes, 2 * 1024 * 1024));
    await handle.read(head, 0, head.length, 0);
    await handle.close();

    const size = jpegSize(head);
    if (!size) {
      throw new OriginalError("No es un JPG. Exportalo como JPG a máxima calidad y probá de nuevo.");
    }

    await rename(tempPath, finalPath);
    return { file, bytes, ...size };
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}

export async function deleteOriginal(file: string | null | undefined): Promise<void> {
  if (!file) return;
  const target = originalPath(file);
  if (target) await rm(target, { force: true });
}

/** El archivo listo para mandar, o null si no está en el disco. */
export async function openOriginal(
  file: string,
): Promise<{ stream: ReadableStream<Uint8Array>; bytes: number } | null> {
  const target = originalPath(file);
  if (!target) return null;
  try {
    const info = await stat(target);
    const stream = Readable.toWeb(createReadStream(target)) as ReadableStream<Uint8Array>;
    return { stream, bytes: info.size };
  } catch {
    return null;
  }
}
