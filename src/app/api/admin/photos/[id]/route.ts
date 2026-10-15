import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { catalogVariants, replaceVariants } from "@/lib/photo-variants";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

type PhotoPayload = {
  categoryId?: number | null;
  name?: string;
  slug?: string;
  description?: string;
  oferta?: boolean;
  preferidos?: boolean;
  pais?: string | null;
  images?: unknown;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photoId = Number(id);

  let payload: PhotoPayload;
  try {
    payload = (await request.json()) as PhotoPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const slug = payload.slug?.trim();
  const description = payload.description?.trim() || null;
  const categoryId = payload.categoryId || null;
  const pais = payload.pais?.trim() || null;
  const images = payload.images ?? [];

  if (!Number.isInteger(photoId) || !name || !slug || !Array.isArray(images)) {
    return NextResponse.json({ error: "Los datos de la fotografía no son válidos." }, { status: 400 });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE photos
       SET category_id = $1, name = $2, slug = $3, description = $4,
           oferta = $5, preferidos = $6, pais = $7, images = $8::jsonb, updated_at = now()
       WHERE id = $9
       RETURNING id`,
      [categoryId, name, slug, description, Boolean(payload.oferta), Boolean(payload.preferidos), pais, JSON.stringify(images), photoId],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
    }

    await replaceVariants(client, photoId, await catalogVariants(client));
    await client.query("COMMIT");

    revalidateCatalog();

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    const message = error instanceof Error ? error.message : "No se pudo actualizar la foto.";
    return NextResponse.json(
      { error: message.includes("duplicate key") ? "El nombre o slug ya existe." : "No se pudo actualizar la foto." },
      { status: message.includes("duplicate key") ? 409 : 500 },
    );
  } finally {
    client?.release();
  }
}

type FlagsPayload = {
  preferidos?: boolean;
  oferta?: boolean;
};

/**
 * Enciende o apaga una bandera de portada de una obra, y nada más.
 *
 * El PUT de arriba pide la obra entera: nombre, slug, país, imagen. Es
 * lo correcto para el formulario, y es justo lo que no sirve para una pantalla
 * donde se marcan diez obras seguidas —cada tilde tendría que mandar de vuelta
 * todo el registro, y un campo que llegue vacío por error pisaría el dato
 * bueno. Acá viaja solo lo que se tocó.
 *
 * Las dos banderas deciden qué se ve en la portada: `preferidos` hace entrar al
 * país de la obra en «My best memories» —basta una obra marcada para que el
 * país aparezca— y `oferta` la pone en «This month's selection».
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photoId = Number(id);

  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: "El id de la fotografía no es válido." }, { status: 400 });
  }

  let payload: FlagsPayload;
  try {
    payload = (await request.json()) as FlagsPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const preferidos = typeof payload.preferidos === "boolean" ? payload.preferidos : null;
  const oferta = typeof payload.oferta === "boolean" ? payload.oferta : null;

  if (preferidos === null && oferta === null) {
    return NextResponse.json({ error: "No se mandó ninguna bandera." }, { status: 400 });
  }

  try {
    /* COALESCE con el nulo: la bandera que no vino se queda como está, en vez
       de apagarse por no haber sido nombrada. */
    const result = await pool.query<{ id: number; preferidos: boolean; oferta: boolean }>(
      `UPDATE photos
       SET preferidos = COALESCE($1, preferidos),
           oferta = COALESCE($2, oferta),
           updated_at = now()
       WHERE id = $3
       RETURNING id, preferidos, oferta`,
      [preferidos, oferta, photoId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
    }

    revalidateCatalog();

    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: "No se pudo cambiar la marca." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photoId = Number(id);

  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: "El id de la fotografía no es válido." }, { status: 400 });
  }

  try {
    const result = await pool.query("DELETE FROM photos WHERE id = $1 RETURNING id", [photoId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
    }

    revalidateCatalog();

    return NextResponse.json({ id: photoId });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar la foto." }, { status: 500 });
  }
}