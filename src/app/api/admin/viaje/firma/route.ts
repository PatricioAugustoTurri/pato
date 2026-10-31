import { NextResponse } from "next/server";
import { firmarSubida, subidaDisponible } from "@/lib/viaje/cloudinary-sign";
import { slugify } from "@/lib/viaje/slug";

/** Una firma de Cloudinary para subir una foto o un video del día. */
export async function POST(request: Request) {
  if (!subidaDisponible()) {
    return NextResponse.json(
      { error: "La subida no está configurada: faltan CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET." },
      { status: 503 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as { tipo?: string; pais?: string };
  const tipo = body.tipo === "video" ? "video" : "foto";
  const pais = slugify(body.pais ?? "") || "sin-pais";
  return NextResponse.json(firmarSubida(tipo, `rumbo-oeste/${pais}`), { headers: { "Cache-Control": "no-store" } });
}
