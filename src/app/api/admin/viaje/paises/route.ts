import { NextResponse } from "next/server";
import { createPais } from "@/lib/viaje/db";
import { rehacerSitio } from "@/lib/viaje/rebuild";
import { parsePais } from "@/lib/viaje/validate";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }
  const parsed = parsePais(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const id = await createPais(parsed.value);
    rehacerSitio();
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("duplicate key")) {
      return NextResponse.json({ error: "Ya hay un país con esa dirección. Cambiá el nombre o el slug." }, { status: 409 });
    }
    console.error("[viaje] no se pudo crear el país:", error);
    return NextResponse.json({ error: "No se pudo crear el país." }, { status: 500 });
  }
}
