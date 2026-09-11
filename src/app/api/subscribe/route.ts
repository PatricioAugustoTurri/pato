import { NextResponse } from "next/server";
import { Resend } from "resend";

type SubscribePayload = { email?: string };

/* La misma comprobación de forma que usa el formulario de contacto, y por el
   mismo motivo: no es una promesa de que la casilla exista. Verificar de verdad
   una dirección es escribirle, y eso lo hará el boletín cuando salga. */
const EMAIL_SHAPE = /^\S+@\S+\.\S+$/;

/**
 * Alta en la carta de viaje.
 *
 * La dirección va a una Audience de Resend —su sistema de listas—, no a una
 * tabla propia: ahí es donde después se escribe el boletín, y las bajas las
 * maneja Resend con su propio enlace, que es justamente la parte que no conviene
 * improvisar.
 */
export async function POST(request: Request) {
  let payload: SubscribePayload;

  try {
    payload = (await request.json()) as SubscribePayload;
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();

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
