import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: RegisterPayload;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Completá tu nombre, email y contraseña." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña tiene que tener al menos 8 caracteres." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'customer')",
      [name, email, passwordHash],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
    return NextResponse.json(
      { error: message.includes("duplicate key") ? "Ya existe una cuenta con ese email." : "No se pudo crear la cuenta." },
      { status: message.includes("duplicate key") ? 409 : 500 },
    );
  }
}
