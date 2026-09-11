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
  stock?: number;
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
  const stock = payload.stock ?? 0;
  const images = payload.images ?? [];

  if (!Number.isInteger(photoId) || !name || !slug || !Array.isArray(images) || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Los datos de la fotografía no son válidos." }, { status: 400 });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE photos
       SET category_id = $1, name = $2, slug = $3, description = $4,
           oferta = $5, preferidos = $6, pais = $7, images = $8::jsonb, stock = $9, updated_at = now()
       WHERE id = $10
       RETURNING id`,
      [categoryId, name, slug, description, Boolean(payload.oferta), Boolean(payload.preferidos), pais, JSON.stringify(images), stock, photoId],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
    }

    // El stock de la obra vale para sus tres tamaños.
    await replaceVariants(client, photoId, catalogVariants(stock));
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