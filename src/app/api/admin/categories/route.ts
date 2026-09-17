import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import type { AdminCategory } from "@/app/admin/components/types";

type CategoryPayload = {
  name?: string;
  slug?: string;
  descripcion?: string;
};

/**
 * El slug de una colección a partir de su nombre.
 *
 * Es la dirección de `/shop/<colección>`, así que se pliegan acentos y se
 * reemplaza todo lo que no sea letra o número: «Retratos de Asia» da
 * `retratos-de-asia`, que se puede escribir a mano y pegar en un mensaje. Mismo
 * criterio que `countrySlug` en `countries.ts`.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  /* `categories.images` guarda la portada como `[["url"]]` —un array dentro de
     otro—, distinto de `photos.images`, que usa `[{ "url": ... }]`. La columna
     se lee acá en las dos formas porque alguna fila vieja quedó con la del
     catálogo, y el panel tiene que poder mostrar igual lo que hay. Lo que
     escribe es siempre la anidada: ver la ruta PUT. */
  const { rows } = await pool.query<AdminCategory>(
    `SELECT id, name, slug, descripcion,
            COALESCE(images #>> '{0,0}', images #>> '{0,url}') AS cover
     FROM categories
     ORDER BY name ASC`,
  );

  return NextResponse.json(rows);
}

/**
 * Crea una colección.
 *
 * Nace sin portada y sin obras: la portada se elige mirando la tira de sus
 * obras, y no hay ninguna todavía. La pantalla lo dice en vez de pedir una URL
 * acá, que sería la única imagen del panel que se carga a ciegas.
 *
 * El texto editorial es opcional y se guarda como `null` si viene vacío. Es la
 * descripción que se lee en `/shop/<colección>`, y en este sitio la escribe el
 * autor: mejor que falte a que salga un relleno.
 */
export async function POST(request: Request) {
  let payload: CategoryPayload;
  try {
    payload = (await request.json()) as CategoryPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const slug = (payload.slug?.trim() || slugify(name ?? "")).toLowerCase();
  const descripcion = payload.descripcion?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "La colección necesita un nombre." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json(
      { error: "Ese nombre no da una dirección válida. Escribí el slug a mano." },
      { status: 400 },
    );
  }

  try {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO categories (name, slug, descripcion, images)
       VALUES ($1, $2, $3, '[]'::jsonb)
       RETURNING id`,
      [name, slug, descripcion],
    );

    revalidateCatalog();

    return NextResponse.json({ id: rows[0].id, name, slug, cover: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message.includes("duplicate key") ? "Ya hay una colección con ese nombre o esa dirección." : "No se pudo crear la colección." },
      { status: message.includes("duplicate key") ? 409 : 500 },
    );
  }
}
