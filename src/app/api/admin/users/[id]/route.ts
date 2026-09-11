import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ALLOWED_ROLES = ["customer", "admin"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = Number(id);

  let payload: { role?: string };
  try {
    payload = (await request.json()) as { role?: string };
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const role = payload.role;

  if (!Number.isInteger(userId) || !role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "El rol indicado no es válido." }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query<{ role: string }>("SELECT role FROM users WHERE id = $1", [userId]);
    const current = rows[0];

    if (!current) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    if (current.role === "admin" && role !== "admin") {
      const { rows: adminCount } = await client.query<{ count: string }>(
        "SELECT count(*) FROM users WHERE role = 'admin'",
      );

      if (Number(adminCount[0].count) <= 1) {
        return NextResponse.json(
          { error: "No podés quitarle el rol de administrador al único admin que queda." },
          { status: 409 },
        );
      }
    }

    const result = await client.query("UPDATE users SET role = $1 WHERE id = $2 RETURNING id", [role, userId]);

    return NextResponse.json({ id: result.rows[0].id });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el rol." }, { status: 500 });
  } finally {
    client.release();
  }
}
