import { NextResponse } from "next/server";
import { rehacerAhora } from "@/lib/viaje/rebuild";

/** Pide a Coolify que rehaga el sitio del viaje ya mismo y contesta si Coolify lo aceptó. */
export async function POST() {
  const sitio = await rehacerAhora();
  return NextResponse.json({ sitio }, { status: sitio.error ? 502 : 200 });
}
