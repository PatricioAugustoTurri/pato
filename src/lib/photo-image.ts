/**
 * Extrae la primera URL utilizable de una columna `images`.
 *
 * La base guarda dos formas distintas: `photos.images` usa
 * `[{ "url": "...", "alt": "..." }]` y `categories.images` usa `[["..."]]`.
 * Mientras esos formatos no se unifiquen, esta función acepta las tres formas
 * que existen hoy (objeto, array anidado y cadena suelta) en un solo lugar,
 * en vez de repetir la misma escalera de comprobaciones en cada página.
 */
export function normalizePhotoImage(images: unknown): string {
  if (!Array.isArray(images)) {
    return "";
  }

  const first = images[0];

  if (typeof first === "string") {
    return first;
  }

  if (Array.isArray(first)) {
    return typeof first[0] === "string" ? first[0] : "";
  }

  if (typeof first === "object" && first !== null && "url" in first) {
    return typeof first.url === "string" ? first.url : "";
  }

  return "";
}

/**
 * Texto alternativo de la primera imagen, cuando el registro lo trae.
 * Sin esto las fotografías del catálogo se anuncian solo por su título, que
 * describe la obra pero no lo que se ve.
 */
export function normalizePhotoAlt(images: unknown, fallback: string): string {
  if (!Array.isArray(images)) {
    return fallback;
  }

  const first = images[0];

  if (typeof first === "object" && first !== null && "alt" in first) {
    const alt = (first as { alt?: unknown }).alt;
    if (typeof alt === "string" && alt.trim()) {
      return alt.trim();
    }
  }

  return fallback;
}
