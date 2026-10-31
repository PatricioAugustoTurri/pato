import { NextResponse } from "next/server";
import { upsertDia } from "@/lib/viaje/db";
import { estadoSitio } from "@/lib/viaje/rebuild";
import { despuesDeGuardar } from "@/lib/viaje/service";
import { parseDia } from "@/lib/viaje/validate";

/**
 * Guarda un día: lo crea o lo actualiza según su `clientId`.
 *
 * Es PUT y no POST porque repetirlo da lo mismo: el teléfono reintenta cuando
 * vuelve la señal sin saber si el intento anterior llegó, y no se duplica nada.
 * Si el día está publicado, se traduce (cuando hace falta) antes de contestar
 * y se pide rehacer el sitio.
 */
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const parsed = parseDia(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const { dia, antes } = await upsertDia(parsed.value);
    const resultado = await despuesDeGuardar(dia, antes);
    return NextResponse.json({ ...resultado, sitio: estadoSitio() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("viaje_dias_pais_id_fkey")) {
      return NextResponse.json({ error: "Ese país ya no existe. Elegí otro." }, { status: 409 });
    }
    console.error("[viaje] no se pudo guardar el día:", error);
    return NextResponse.json({ error: "No se pudo guardar el día." }, { status: 500 });
  }
}
