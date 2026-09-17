import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { VARIANTS_SUBQUERY, catalogVariants, replaceVariants } from "@/lib/photo-variants";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import type { AdminPhoto } from "@/app/admin/components/types";

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

function isValidImages(images: unknown): images is unknown[] {
  return Array.isArray(images);
}

export async function POST(request: Request) {
  let client;

  try {
    const payload = (await request.json()) as PhotoPayload;
    const name = payload.name?.trim();
    const slug = payload.slug?.trim();
    const description = payload.description?.trim() || null;
    const categoryId = payload.categoryId || null;
    const pais = payload.pais?.trim() || null;
    const images = payload.images ?? [];

    if (!name || !slug) {
      return NextResponse.json(
        { error: "El nombre y el slug son obligatorios." },
        { status: 400 },
      );
    }

    if (!isValidImages(images)) {
      return NextResponse.json(
        { error: "Las imágenes deben ser un array JSON válido." },
        { status: 400 },
      );
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const photoResult = await client.query<{ id: number }>(
      `INSERT INTO photos (category_id, name, slug, description, oferta, preferidos, pais, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
       RETURNING id`,
      [categoryId, name, slug, description, Boolean(payload.oferta), Boolean(payload.preferidos), pais, JSON.stringify(images)],
    );

    /* Los tamaños no se cargan: son los del catálogo, iguales para toda obra,
       y sin existencias porque cada copia se imprime cuando se vende. */
    const photoId = photoResult.rows[0].id;
    await replaceVariants(client, photoId, await catalogVariants(client));

    await client.query("COMMIT");

    revalidateCatalog();

    return NextResponse.json({ id: photoId }, { status: 201 });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    const message = error instanceof Error ? error.message : "No se pudo guardar la foto.";
    const status = message.includes("duplicate key") ? 409 : 500;

    return NextResponse.json(
      { error: status === 409 ? "El nombre o slug ya existe." : "No se pudo guardar la foto." },
      { status },
    );
  } finally {
    client?.release();
  }
}

export async function GET() {
  const { rows } = await pool.query<AdminPhoto>(
    `SELECT p.id, p.category_id AS "categoryId", p.name, p.slug, p.description,
            p.oferta, p.preferidos, p.pais, p.images,
            ${VARIANTS_SUBQUERY}
     FROM photos p
     ORDER BY p.id DESC`,
  );

  return NextResponse.json(rows);
}
