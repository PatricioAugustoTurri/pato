import { NextResponse } from "next/server";
import { Resend } from "resend";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const subject = payload.subject?.trim();
  const message = payload.message?.trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "El formulario de contacto no está configurado todavía." },
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
      return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 500 });
  }
}
