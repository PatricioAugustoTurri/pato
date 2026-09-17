import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { looksLikeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  /* Cada intento escribe —o intenta escribir— una fila en `users`, y cada uno
     calcula un hash de bcrypt con coste 12, que es medio segundo de CPU a
     propósito. Sin tope, un bucle llena la tabla de cuentas fantasma y de paso
     deja al servidor sin aire para atender a quien está comprando. Cinco
     intentos por cuarto de hora alcanzan de sobra: una persona se registra una
     vez. */
  const allowed = rateLimit(
    request,
    "register",
    { limit: 5, windowMs: 15 * 60_000 },
    { limit: 40, windowMs: 60 * 60_000 },
  );

  if (!allowed.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  let payload: RegisterPayload;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Fill in your name, email and password." }, { status: 400 });
  }

  /* La dirección es el nombre de usuario y el único camino de vuelta a la
     cuenta. Una sin forma de dirección crea una cuenta a la que nadie puede
     escribirle nunca —ni para un pedido, ni para recuperar la contraseña—. */
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "Check the format of the email." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Your password needs at least 8 characters." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'customer')",
      [name, email, passwordHash],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't create the account. Try again.";
    return NextResponse.json(
      { error: message.includes("duplicate key") ? "An account with that email already exists. Sign in instead." : "We couldn't create the account. Try again." },
      { status: message.includes("duplicate key") ? 409 : 500 },
    );
  }
}
