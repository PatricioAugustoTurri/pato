import { NextResponse } from "next/server";
import { readAdminViaje } from "@/lib/viaje/db";
import { estadoSitio } from "@/lib/viaje/rebuild";
import { traduccionDisponible } from "@/lib/viaje/translate";
import { subidaDisponible } from "@/lib/viaje/cloudinary-sign";
import type { AdminViaje } from "@/lib/viaje/types";

export const dynamic = "force-dynamic";

/** Todo el viaje para el panel: países, paradas y días, borradores incluidos. */
export async function GET() {
  const { paises, dias } = await readAdminViaje();
  const body: AdminViaje & { sube: boolean } = {
    paises,
    dias,
    sitio: estadoSitio(),
    traduce: traduccionDisponible(),
    sube: subidaDisponible(),
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
