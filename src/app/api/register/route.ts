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
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Fill in your name, email and password." }, { status: 400 });
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
