import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { PhotoDetailRow, PhotoVariant } from "@/types/PhotoType";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; photoSlug: string }> },
) {
  const { slug, photoSlug } = await params;
  const { rows } = await pool.query<Omit<PhotoDetailRow, "variants">>(
    `SELECT p.id,
            p.name,
            p.slug,
            p.description,
            p.images,
            c.name AS "categoryName",
            c.slug AS "categorySlug"
     FROM photos p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE c.slug = $1 AND p.slug = $2
     LIMIT 1`,
    [slug, photoSlug],
  );

  const photo = rows[0];

  if (!photo) {
    return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 });
  }

  const { rows: variants } = await pool.query<PhotoVariant>(
    `SELECT id, size, price, stock
     FROM photo_variants
     WHERE photo_id = $1
     ORDER BY price ASC`,
    [photo.id],
  );

  return NextResponse.json({ ...photo, variants } satisfies PhotoDetailRow);
}