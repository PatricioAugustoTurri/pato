import { revalidatePath } from "next/cache";

/**
 * Marca para rehacer las tres páginas que no leen la base en cada visita.
 *
 * La portada, `/shop` y `/destinations` se prerrenderizan porque su contenido
 * casi nunca cambia y son las más visitadas: hacerlas dinámicas sería consultar
 * la base en cada visita para devolver casi siempre lo mismo. Las tres llevan
 * `revalidate = 3600`, así que caducan solas cada hora y sus recuentos —"Works
 * · Countries · Collections" y las obras por país— nunca quedan viejos más de
 * ese rato.
 *
 * Esto es lo que cubre la hora que falta. Una obra nueva ya aparece sola, pero
 * hasta una hora después; con este aviso desde el panel, Next las rehace en la
 * siguiente visita. La diferencia entre las dos cosas es el tiempo, no el
 * resultado: sin `revalidate` esto era la única manera de actualizarlas sin
 * volver a subir el sitio, y con él es lo que evita la espera.
 *
 * Las fichas de obra y las colecciones NO están acá: son dinámicas, leen la
 * base en cada visita y ya salen al día solas.
 */
export function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/destinations");
}
