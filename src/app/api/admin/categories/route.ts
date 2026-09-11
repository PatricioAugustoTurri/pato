import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { AdminCategory } from "@/app/admin/components/types";

export async function GET() {
  const { rows } = await pool.query<AdminCategory>(
    `SELECT id, name, slug
     FROM categories
     ORDER BY name ASC`,
  );

  return NextResponse.json(rows);
}
