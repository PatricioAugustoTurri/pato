import { NextResponse } from "next/server";
import { deletePais, setEstadoPais, updatePais } from "@/lib/viaje/db";
import { rehacerSitio } from "@/lib/viaje/rebuild";
import type { EstadoPais } from "@/lib/viaje/types";
import { parsePais } from "@/lib/viaje/validate";

type Params = { params: Promise<{ id: string }> };

/** Edición completa del país (nombres, cruce, resumen, paradas). */
export async function PUT(request: Request, { params }: Params) {
  const id = Number((await params).id);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }
  const parsed = parsePais(body);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "El país no es válido." }, { status: 400 });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!(await updatePais(id, parsed.value))) {
    return NextResponse.json({ error: "Ese país ya no existe." }, { status: 404 });
  }
  if (parsed.value.estado === "en_curso") await setEstadoPais(id, "en_curso");
  rehacerSitio();
  return NextResponse.json({ ok: true });
}

/** Solo el estado: el toque rápido de "llegué" o "ya lo dejé". */
export async function PATCH(request: Request, { params }: Params) {
  const id = Number((await params).id);
  const body = (await request.json().catch(() => ({}))) as { estado?: EstadoPais };
  if (!Number.isInteger(id) || !["por_llegar", "en_curso", "recorrido"].includes(body.estado ?? "")) {
    return NextResponse.json({ error: "El estado no es válido." }, { status: 400 });
  }
  if (!(await setEstadoPais(id, body.estado!))) {
    return NextResponse.json({ error: "Ese país ya no existe." }, { status: 404 });
  }
  rehacerSitio();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "El país no es válido." }, { status: 400 });
  const result = await deletePais(id);
  if (result === "con-dias") {
    return NextResponse.json({ error: "Este país tiene días cargados. Movelos a otro país o borralos primero." }, { status: 409 });
  }
  if (result === "no-existe") return NextResponse.json({ error: "Ese país ya no existe." }, { status: 404 });
  rehacerSitio();
  return NextResponse.json({ ok: true });
}
