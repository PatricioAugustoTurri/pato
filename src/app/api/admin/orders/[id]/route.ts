import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ALLOWED_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orderId = Number(id);

  let payload: { status?: string };
  try {
    payload = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const status = payload.status;

  if (!Number.isInteger(orderId) || !status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: "El estado indicado no es válido." }, { status: 400 });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING id",
      [status, orderId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ id: result.rows[0].id });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
  }
}
