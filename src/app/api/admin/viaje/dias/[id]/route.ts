import { NextResponse } from "next/server";
import { deleteDia } from "@/lib/viaje/db";
import { estadoSitio, rehacerSitio } from "@/lib/viaje/rebuild";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "El día no es válido." }, { status: 400 });

  const borrado = await deleteDia(id);
  if (!borrado) return NextResponse.json({ error: "Ese día ya no existe." }, { status: 404 });
  if (borrado.publicado) rehacerSitio();
  return NextResponse.json({ ok: true, sitio: estadoSitio() });
}
