import { NextResponse } from "next/server";
import { Resend } from "resend";
import { looksLikeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export async function POST(request: Request) {
  /* Antes de leer nada. Esta ruta termina en un correo, o sea en la cuota
     mensual de Resend y en la casilla que el autor lee de verdad: un bucle
     desde una consola alcanzaba para llenar las dos. Tres mensajes cada diez
     minutos es más de lo que escribe cualquier persona que tenga algo que
     decir; treinta por hora en total es el techo que ningún día honesto de
     esta tienda va a tocar. */
  const allowed = rateLimit(
    request,
    "contact",
    { limit: 3, windowMs: 10 * 60_000 },
    { limit: 30, windowMs: 60 * 60_000 },
  );

  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Too many messages from here. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const subject = payload.subject?.trim();
  const message = payload.message?.trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Some required fields are missing." }, { status: 400 });
  }

  /* El formulario ya lo comprueba mientras se escribe, pero un `POST` no pasa
     por el formulario. Esta dirección viaja como `replyTo`: si no tiene forma
     de dirección, el mensaje llega y el autor no puede contestarlo, que es lo
     único que el formulario tiene que garantizar. */
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "Check the format of the email." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "The contact form is not set up yet." },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Pato Turri <${from}>`,
      to,
      replyTo: email,
      subject: `[Contacto] ${subject}`,
      text: `De: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      return NextResponse.json({ error: "We could not send the message." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We could not send the message." }, { status: 500 });
  }
}
