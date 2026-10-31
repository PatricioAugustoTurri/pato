import { NextResponse } from "next/server";
import { errorClaude, ordenarDictado, traduccionDisponible } from "@/lib/viaje/translate";

/** Deja prolijo un texto dictado por voz: puntuación y párrafos, sin cambiar lo que dijo. */
export async function POST(request: Request) {
  if (!traduccionDisponible()) {
    return NextResponse.json({ error: "Ordenar el texto necesita ANTHROPIC_API_KEY en el servidor." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { texto?: unknown };
  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  if (!texto) return NextResponse.json({ error: "No hay texto para ordenar." }, { status: 400 });
  if (texto.length > 40_000) return NextResponse.json({ error: "El texto es demasiado largo." }, { status: 400 });
  try {
    return NextResponse.json({ texto: await ordenarDictado(texto) });
  } catch (error) {
    console.error("[viaje] ordenar dictado:", error);
    return NextResponse.json({ error: `No se pudo ordenar: ${errorClaude(error)}` }, { status: 502 });
  }
}
