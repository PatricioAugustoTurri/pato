import { NextResponse } from "next/server";
import { downloadsForSession } from "@/lib/downloads";

/*
 * Los links de descarga de un pedido, para la página de "gracias".
 *
 * Stripe vuelve a /checkout/success apenas se paga, y el webhook que crea los
 * links puede llegar uno o dos segundos después: la página pregunta acá hasta
 * que `paid` sea true. La llave es el `session_id` de Stripe, que solo conoce
 * quien acaba de pagar.
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";

  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const result = await downloadsForSession(sessionId);
  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
