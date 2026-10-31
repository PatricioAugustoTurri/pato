import { NextResponse } from "next/server";
import { readViajePublico } from "@/lib/viaje/db";

export const dynamic = "force-dynamic";

/**
 * El diario publicado, para que el sitio del viaje (Astro, en otra app de
 * Coolify) lo lea al compilarse. Solo días publicados y nada que no se vaya a
 * mostrar igual en la página: es público a propósito.
 */
export async function GET() {
  try {
    return NextResponse.json(await readViajePublico(), {
      headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("[viaje] no se pudo leer el diario:", error);
    return NextResponse.json({ error: "No se pudo leer el diario." }, { status: 500 });
  }
}
