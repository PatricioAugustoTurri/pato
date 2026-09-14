import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EMAIL_SHAPE } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

type SubscribePayload = { email?: string };

/**
 * Alta en la carta de viaje.
 *
 * La dirección va a una Audience de Resend —su sistema de listas—, no a una
 * tabla propia: ahí es donde después se escribe el boletín, y las bajas las
 * maneja Resend con su propio enlace, que es justamente la parte que no conviene
 * improvisar.
 */
export async function POST(request: Request) {
  /* La lista es de direcciones reales o no es una lista: sin tope, cualquiera
     la llena de casillas inventadas y el día que salga el boletín la mitad
     rebota —y los rebotes los paga la reputación del dominio, que es lo que
     decide si los correos caen en bandeja o en spam—. */
  const allowed = rateLimit(
    request,
    "subscribe",
    { limit: 5, windowMs: 10 * 60_000 },
    { limit: 60, windowMs: 60 * 60_000 },
  );

  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  let payload: SubscribePayload;

  try {
    payload = (await request.json()) as SubscribePayload;
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();

  /* La misma comprobación de forma que usa el formulario de contacto —ahora sí
     la misma, escrita una vez en `@/lib/email`—, y por el mismo motivo: no es
     una promesa de que la casilla exista. Verificar de verdad una dirección es
     escribirle, y eso lo hará el boletín cuando salga. */
  if (!email || !EMAIL_SHAPE.test(email)) {
    return NextResponse.json({ error: "Check the format of the email." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "The travel letter is not set up yet." }, { status: 503 });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({ email, audienceId, unsubscribed: false });

    if (error) {
      return NextResponse.json({ error: "We could not add you to the list." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We could not add you to the list." }, { status: 500 });
  }
}
