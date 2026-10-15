import { NextResponse, after } from "next/server";
import { looksLikeEmail } from "@/lib/email";
import { createPasswordReset, sendPasswordResetEmail } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/seo";

/**
 * Pide un enlace para cambiar la contraseña.
 *
 * Responde siempre lo mismo, exista o no la cuenta: si dijera "no hay ninguna
 * cuenta con ese email", cualquiera podría usar este formulario para averiguar
 * quién compra en la tienda.
 */
export async function POST(request: Request) {
  /* Cada pedido manda un mail y gasta cuota de Resend. Tres por cuarto de hora
     alcanzan para quien no encuentra el primero en la bandeja. */
  const allowed = rateLimit(
    request,
    "password-forgot",
    { limit: 3, windowMs: 15 * 60_000 },
    { limit: 30, windowMs: 60 * 60_000 },
  );

  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  let email: string;
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  if (!email || !looksLikeEmail(email)) {
    return NextResponse.json({ error: "Check the format of the email." }, { status: 400 });
  }

  try {
    const reset = await createPasswordReset(email);

    if (reset) {
      /* El enlace se arma con la dirección pública del sitio, nunca con el
         `Host` del pedido: ese encabezado lo escribe quien pide, y con él se
         podría mandarle a un cliente un enlace auténtico apuntando a otro
         dominio. */
      const link = absoluteUrl(`/reset-password?token=${encodeURIComponent(reset.token)}`);
      /* Después de responder: el tiempo de la respuesta tampoco tiene que
         delatar si había una cuenta detrás. */
      after(() => sendPasswordResetEmail(reset.email, reset.name, link));
    }
  } catch (error) {
    console.error("[password-forgot] no se pudo preparar el enlace:", error);
    return NextResponse.json({ error: "We could not send the link. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
