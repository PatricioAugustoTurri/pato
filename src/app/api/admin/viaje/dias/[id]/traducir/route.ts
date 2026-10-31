import { NextResponse } from "next/server";
import { readDia } from "@/lib/viaje/db";
import { estadoSitio } from "@/lib/viaje/rebuild";
import { despuesDeGuardar } from "@/lib/viaje/service";
import { traduccionDisponible } from "@/lib/viaje/translate";

/** "Traducir de nuevo": pisa el inglés, aunque estuviera revisado. Lo pide el autor. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!traduccionDisponible()) {
    return NextResponse.json({ error: "La traducción automática no está configurada (falta ANTHROPIC_API_KEY)." }, { status: 503 });
  }
  const id = Number((await params).id);
  const dia = Number.isInteger(id) ? await readDia(id) : null;
  if (!dia) return NextResponse.json({ error: "Ese día ya no existe." }, { status: 404 });

  const resultado = await despuesDeGuardar(dia, { publicado: dia.publicado }, { forzarTraduccion: true });
  if (resultado.avisoTraduccion) return NextResponse.json({ error: resultado.avisoTraduccion }, { status: 502 });
  return NextResponse.json({ ...resultado, sitio: estadoSitio() });
}
