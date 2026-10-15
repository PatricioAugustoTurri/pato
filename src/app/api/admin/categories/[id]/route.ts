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

type DetailsPayload = {
  name?: string;
  descripcion?: string;
};

/**
 * Cambia el nombre y el texto editorial de una colección.
 *
 * Separado del PUT de arriba a propósito: ese cambia la portada y recibe el id
 * de una obra; este recibe texto. Meterlos en la misma ruta obligaría a
 * adivinar cuál de las dos cosas se quiso hacer según qué campos llegaron.
 *
 * El slug NO se toca. Es la dirección de `/shop/<colección>`: cambiarlo rompe
 * todo enlace que alguien haya guardado o compartido, y lo deja fuera del mapa
 * del sitio que Google ya indexó. Si alguna vez hace falta, es una decisión con
 * redirección detrás, no un campo más de un formulario.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ error: "La colección no es válida." }, { status: 400 });
  }

  let payload: DetailsPayload;
  try {
    payload = (await request.json()) as DetailsPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const descripcion = payload.descripcion?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "La colección necesita un nombre." }, { status: 400 });
  }

  try {
    const result = await pool.query<{ id: number; name: string; descripcion: string | null }>(
      `UPDATE categories
       SET name = $1, descripcion = $2, updated_at = now()
       WHERE id = $3
       RETURNING id, name, descripcion`,
      [name, descripcion, categoryId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Colección no encontrada." }, { status: 404 });
    }

    revalidateCatalog();

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message.includes("duplicate key") ? "Ya hay una colección con ese nombre." : "No se pudo guardar la colección." },
      { status: message.includes("duplicate key") ? 409 : 500 },
    );
  }
}

/**
 * Borra una colección, y solo si está vacía.
 *
 * La llave foránea de `photos.category_id` es `ON DELETE SET NULL`, así que
 * borrar una colección con obras adentro no borra nada visible: deja las obras
 * sin colección. Y una obra sin colección no tiene ruta —`/shop/[slug]/[obra]`
 * la necesita— así que desaparece de la tienda, de la portada y del mapa del
 * sitio sin un solo error, y sin que nadie haya pedido darla de baja.
 *
 * Por eso acá se cuenta primero y se niega con el número puesto, en vez de
 * dejar hacer y avisar después. Vaciar la colección es mover cada obra a otra,
 * que es una decisión obra por obra y se toma en la pantalla de fotografías.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ error: "La colección no es válida." }, { status: 400 });
  }

  try {
    const works = await pool.query<{ total: number }>(
      "SELECT count(*)::int AS total FROM photos WHERE category_id = $1",
      [categoryId],
    );

    const total = works.rows[0]?.total ?? 0;

    if (total > 0) {
      return NextResponse.json(
        {
          error:
            total === 1
              ? "Esta colección todavía tiene 1 obra. Movela a otra colección antes de borrarla."
              : `Esta colección todavía tiene ${total} obras. Movelas a otra colección antes de borrarla.`,
        },
        { status: 409 },
      );
    }

    const result = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING id", [categoryId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Colección no encontrada." }, { status: 404 });
    }

    revalidateCatalog();

    return NextResponse.json({ id: categoryId });
  } catch {
    return NextResponse.json({ error: "No se pudo borrar la colección." }, { status: 500 });
  }
}
