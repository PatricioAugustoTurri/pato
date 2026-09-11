import { pool } from "@/lib/db";

/**
 * Desde cuándo existe esta cuenta.
 *
 * Va en su propia consulta y no unida a la de pedidos por dos razones: ahí se
 * repetiría en cada fila, y no devolvería nada justo en el estado sin pedidos,
 * que es donde es el único hecho que el mostrador tiene para mostrar.
 */
export async function getMemberSince(userId: number): Promise<Date | null> {
  if (!Number.isInteger(userId) || userId <= 0) return null;

  try {
    const { rows } = await pool.query<{ createdAt: Date }>(
      `SELECT created_at AS "createdAt" FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    return rows[0]?.createdAt ?? null;
  } catch {
    return null;
  }
}
