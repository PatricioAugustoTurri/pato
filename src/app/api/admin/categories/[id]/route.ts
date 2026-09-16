import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { normalizePhotoImage } from "@/lib/photo-image";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

type CoverPayload = {
  photoId?: number;
};

/**
 * Cambia la portada de una colección: la imagen que la representa en `/shop` y
 * la que abre `/shop/<colección>`.
 *
 * La URL no viaja desde el navegador. El panel manda el id de la obra y el
 * servidor va a buscar su imagen, por dos razones. Una es la de siempre: lo que
 * manda el cliente no decide qué se publica. La otra es el formato — la portada
 * se guarda como `[["url"]]` y no como el `[{ url, alt }]` de las fotos, y si
 * se copia la forma del catálogo, `/shop/<colección>` sale bien y `/shop` se
 * queda sin portada, sin un solo error en consola. Escribiéndola acá, esa forma
 * se arma en un solo lugar.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const categoryId = Number(id);

  let payload: CoverPayload;
  try {
    payload = (await request.json()) as CoverPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const photoId = Number(payload.photoId);

  if (!Number.isInteger(categoryId) || !Number.isInteger(photoId)) {
    return NextResponse.json({ error: "La colección o la obra no son válidas." }, { status: 400 });
  }

  try {
    const photo = await pool.query<{ images: unknown }>(
      "SELECT images FROM photos WHERE id = $1",
      [photoId],
    );

    if (photo.rowCount === 0) {
      return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
    }

    const cover = normalizePhotoImage(photo.rows[0].images);

    if (!cover) {
      return NextResponse.json({ error: "Esa obra no tiene imagen cargada." }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE categories
       SET images = $1::jsonb, updated_at = now()
       WHERE id = $2
       RETURNING id`,
      [JSON.stringify([[cover]]), categoryId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Colección no encontrada." }, { status: 404 });
    }

    /* Esto es la mitad del punto de que la portada se cambie desde el panel y
       no contra la base: `/shop` se rehace cada hora, así que un UPDATE a mano
       se ve recién cuando vence esa hora. El aviso la rehace en la próxima
       visita. */
    revalidateCatalog();

    return NextResponse.json({ id: categoryId, cover });
  } catch {
    return NextResponse.json({ error: "No se pudo cambiar la portada." }, { status: 500 });
  }
}
