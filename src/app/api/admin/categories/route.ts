import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { AdminCategory } from "@/app/admin/components/types";

export async function GET() {
  /* `categories.images` guarda la portada como `[["url"]]` —un array dentro de
     otro—, distinto de `photos.images`, que usa `[{ "url": ... }]`. La columna
     se lee acá en las dos formas porque alguna fila vieja quedó con la del
     catálogo, y el panel tiene que poder mostrar igual lo que hay. Lo que
     escribe es siempre la anidada: ver la ruta PUT. */
  const { rows } = await pool.query<AdminCategory>(
    `SELECT id, name, slug,
            COALESCE(images #>> '{0,0}', images #>> '{0,url}') AS cover
     FROM categories
     ORDER BY name ASC`,
  );

  return NextResponse.json(rows);
}
