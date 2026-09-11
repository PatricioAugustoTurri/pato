/* El catalogo mezcla formatos: hay obra en 3:2 horizontal y obra en 2:3
   vertical, y la base no guarda las dimensiones. Sin saber la proporcion real
   hay que elegir una caja fija, y toda foto que no la comparta se recorta:
   una vertical dentro de una caja 1.93 pierde dos tercios de la imagen.

   Cloudinary la sabe. `fl_getinfo` devuelve las dimensiones del original en
   JSON, y la respuesta se cachea un dia: son unas pocas consultas, no una por
   visita. Si algo falla se asume 3:2, que es el formato mayoritario. */

const FALLBACK_RATIO = 1.5;

type GetInfo = {
  input?: { width?: number; height?: number };
  output?: { width?: number; height?: number };
  width?: number;
  height?: number;
};

function readSize(data: GetInfo): { width: number; height: number } | null {
  const candidates = [data.input, data.output, data];
  for (const candidate of candidates) {
    const width = candidate?.width;
    const height = candidate?.height;
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

/** Proporcion ancho/alto del original. 1.5 = 3:2 horizontal; 0.667 = 2:3 vertical. */
export async function getImageRatio(url: string): Promise<number> {
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return FALLBACK_RATIO;

  const probe = `${url.slice(0, at + marker.length)}fl_getinfo/${url.slice(at + marker.length)}`;

  try {
    const response = await fetch(probe, { next: { revalidate: 86400 } });
    if (!response.ok) return FALLBACK_RATIO;

    const size = readSize((await response.json()) as GetInfo);
    if (!size) return FALLBACK_RATIO;

    /* Redondeado a tres decimales: es un valor que va al CSS, no hace falta
       mas precision y evita reflows por diferencias invisibles. */
    return Math.round((size.width / size.height) * 1000) / 1000;
  } catch {
    return FALLBACK_RATIO;
  }
}
