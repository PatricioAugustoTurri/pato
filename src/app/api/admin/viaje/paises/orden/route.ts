import { NextResponse } from "next/server";
import { reorderPaises } from "@/lib/viaje/db";
import { rehacerSitio } from "@/lib/viaje/rebuild";

/** El orden de la ruta, de este a oeste: la lista entera de ids, en orden. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.map(Number) : [];
  if (ids.length === 0 || !ids.every(Number.isInteger)) {
    return NextResponse.json({ error: "El orden no es válido." }, { status: 400 });
  }
  await reorderPaises(ids);
  rehacerSitio();
  return NextResponse.json({ ok: true });
}
