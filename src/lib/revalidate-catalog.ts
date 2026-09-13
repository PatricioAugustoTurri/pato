import { revalidatePath } from "next/cache";

/**
 * Marca para rehacer las tres páginas que no leen la base en cada visita.
 *
 * La portada, `/shop` y `/destinations` se compilan una sola vez porque su
 * contenido casi nunca cambia y son las más visitadas: hacerlas dinámicas sería
 * consultar la base en cada visita para devolver casi siempre lo mismo.
 *
 * El precio de eso es que una obra nueva no aparece sola ni en la portada, ni
 * en el índice de la tienda, ni en el mapa de países —y los recuentos de "41
 * obras · 12 países" quedan viejos—, aunque la obra ya exista y su ficha se vea
 * perfecta. Por eso el panel avisa cada vez que toca el catálogo: Next las
 * rehace en la siguiente visita, sin volver a subir el sitio.
 *
 * Las fichas de obra y las colecciones NO están acá: son dinámicas, leen la
 * base en cada visita y ya salen al día solas.
 */
export function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/destinations");
}
