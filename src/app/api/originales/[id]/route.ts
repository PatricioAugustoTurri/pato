import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { OriginalError, deleteOriginal, saveOriginal } from "@/lib/originals";
import { MAX_ORIGINAL_BYTES } from "@/lib/digital";

/*
 * Subir y quitar el JPG original de una obra, desde el panel.
 *
 * NO cuelga de /api/admin a propósito. Todo lo que pasa por `src/proxy.ts` se
 * copia en memoria para poder leerse dos veces, y Next corta esa copia en 10 MB
 * sin avisar a la ruta: un original de 25 MB llegaba truncado. Fuera del
 * matcher el cuerpo viaja como stream directo al disco, y el permiso se
 * comprueba acá, con la misma regla que el proxy (sesión con rol admin).
 */

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function readId(id: string): number | null {
  const photoId = Number(id);
  return Number.isInteger(photoId) && photoId > 0 ? photoId : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const photoId = readId((await params).id);
  if (!photoId) {
    return NextResponse.json({ error: "El id de la fotografía no es válido." }, { status: 400 });
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_ORIGINAL_BYTES) {
    return NextResponse.json(
      { error: `El archivo pasa de ${MAX_ORIGINAL_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: "No llegó ningún archivo." }, { status: 400 });
  }

  const { rows } = await pool.query<{ slug: string; original_file: string | null }>(
    "SELECT slug, original_file FROM photos WHERE id = $1",
    [photoId],
  );
  const photo = rows[0];
  if (!photo) {
    return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
  }

  try {
    const saved = await saveOriginal(photo.slug, request.body);

    await pool.query(
      `UPDATE photos
       SET original_file = $2, original_bytes = $3, original_width = $4, original_height = $5,
           original_uploaded_at = now()
       WHERE id = $1`,
      [photoId, saved.file, saved.bytes, saved.width, saved.height],
    );

    /* El anterior se borra recién ahora, con el nuevo ya guardado y anotado. */
    if (photo.original_file && photo.original_file !== saved.file) {
      await deleteOriginal(photo.original_file);
    }

    return NextResponse.json({
      bytes: saved.bytes,
      width: saved.width,
      height: saved.height,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof OriginalError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`[originales] no se pudo guardar el original de la obra ${photoId}:`, error);
    return NextResponse.json({ error: "No se pudo guardar el original." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const photoId = readId((await params).id);
  if (!photoId) {
    return NextResponse.json({ error: "El id de la fotografía no es válido." }, { status: 400 });
  }

  const { rows } = await pool.query<{ original_file: string | null }>(
    `UPDATE photos p
     SET original_file = NULL, original_bytes = NULL, original_width = NULL,
         original_height = NULL, original_uploaded_at = NULL
     FROM (SELECT id, original_file FROM photos WHERE id = $1 FOR UPDATE) old
     WHERE p.id = old.id
     RETURNING old.original_file`,
    [photoId],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Fotografía no encontrada." }, { status: 404 });
  }

  await deleteOriginal(rows[0].original_file);
  return NextResponse.json({ ok: true });
}
