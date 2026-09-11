import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { AdminOrder } from "@/app/admin/orders/components/types";

export async function GET() {
  const { rows } = await pool.query<AdminOrder>(
    `SELECT id, status, items,
            total_cents AS "totalCents", email,
            customer_name AS "customerName", customer_phone AS "customerPhone",
            shipping_address AS "shippingAddress", shipping_option AS "shippingOption",
            shipping_amount_cents AS "shippingAmountCents",
            amount_total_cents AS "amountTotalCents",
            created_at AS "createdAt"
     FROM orders
     WHERE status != 'pending'
     ORDER BY created_at DESC`,
  );

  return NextResponse.json(rows);
}
