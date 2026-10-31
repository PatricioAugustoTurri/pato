/**
 * La dirección de un país o una parada a partir de su nombre: «Kirguistán» da
 * `kirguistan`. Mismo criterio que el slug de las colecciones, pero en un
 * archivo que también puede importar el panel (el de las colecciones vive en
 * una ruta de la API).
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
