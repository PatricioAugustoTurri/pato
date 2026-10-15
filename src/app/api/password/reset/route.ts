import { NextResponse } from "next/server";
import { MIN_PASSWORD_LENGTH, consumePasswordReset } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";

/** Cambia la contraseña con el token del enlace. */
export async function POST(request: Request) {
  /* Cada intento calcula un bcrypt de coste 12. El token no se puede adivinar
     —son 32 bytes al azar—, así que el tope protege la CPU, no el secreto. */
  const allowed = rateLimit(
    request,
    "password-reset",
    { limit: 10, windowMs: 15 * 60_000 },
    { limit: 60, windowMs: 60 * 60_000 },
  );

  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  let token: string;
  let password: string;
  try {
    const body = (await request.json()) as { token?: unknown; password?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json(
      { error: "This link is not complete. Open the one in the email again." },
      { status: 400 },
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const changed = await consumePasswordReset(token, password);

    if (!changed) {
      return NextResponse.json(
        { error: "This link has expired or was already used. Ask for a new one." },
        { status: 410 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[password-reset] no se pudo cambiar la contraseña:", error);
    return NextResponse.json({ error: "We could not change the password. Try again." }, { status: 500 });
  }
}
