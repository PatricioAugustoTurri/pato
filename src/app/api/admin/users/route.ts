import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  if (local.length <= 2) return `${local[0] ?? "•"}•@${domain}`;
  return `${local[0]}${"•".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export async function GET() {
  const { rows } = await pool.query<{
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>(
    `SELECT id, name, email, role, created_at AS "createdAt"
     FROM users
     ORDER BY created_at DESC`,
  );

  const users = rows.map((row) => ({ ...row, email: maskEmail(row.email) }));

  return NextResponse.json(users);
}
