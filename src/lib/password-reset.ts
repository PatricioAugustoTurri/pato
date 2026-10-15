import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { pool } from "@/lib/db";
import { ACCENT, INK, LINE, MONO, MUTED, PAPER, escape, masthead, shell } from "@/lib/order-email";

/**
 * Recuperar la contraseña con un enlace de un solo uso.
 *
 * El token viaja solo en el mail; en la base queda su SHA-256. Quien lea la
 * tabla —un respaldo filtrado, un acceso de más— no puede usar ningún enlace
 * vigente. SHA-256 y no bcrypt porque el token son 32 bytes al azar: no hay
 * diccionario contra el que probar, y hace falta buscarlo por igualdad.
 *
 * Una hora de vida y un solo uso. Pedir uno nuevo anula los anteriores, así
 * que nunca hay más de un enlace vivo por cuenta.
 */

const TOKEN_TTL_MS = 60 * 60_000;

export const MIN_PASSWORD_LENGTH = 8;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Prepara un enlace para ese email, si hay una cuenta con contraseña detrás.
 *
 * Devuelve `null` tanto si la cuenta no existe como si no puede entrar con
 * contraseña: la ruta responde lo mismo en todos los casos, así que desde
 * afuera no se puede averiguar quién es cliente.
 */
export async function createPasswordReset(
  email: string,
): Promise<{ token: string; name: string; email: string } | null> {
  const { rows } = await pool.query<{ id: number; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE email = $1 AND password_hash IS NOT NULL LIMIT 1`,
    [email],
  );

  const user = rows[0];
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    /* Los enlaces anteriores dejan de servir: el que vale es el último mail. */
    await client.query(
      `UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`,
      [user.id],
    );
    await client.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashToken(token), new Date(Date.now() + TOKEN_TTL_MS)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { token, name: user.name, email: user.email };
}

/**
 * Cambia la contraseña si el enlace sigue vivo, y lo gasta en el mismo paso.
 *
 * El `UPDATE ... RETURNING` es el que decide: dos envíos simultáneos del mismo
 * enlace no pueden cambiar la contraseña dos veces, porque solo uno encuentra
 * la fila con `used_at` vacío.
 */
export async function consumePasswordReset(token: string, password: string): Promise<boolean> {
  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ userId: number }>(
      `UPDATE password_resets
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id AS "userId"`,
      [hashToken(token)],
    );

    const reset = rows[0];
    if (!reset) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      passwordHash,
      reset.userId,
    ]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * El mail con el enlace. Misma cáscara que la confirmación de pedido —papel,
 * filete, wordmark en texto— para que no parezca un correo de otro remitente,
 * que es justo lo que alguien desconfiado mira antes de hacer clic.
 *
 * No lanza: un fallo de Resend queda en el log y la ruta responde igual.
 */
export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  const replyTo = process.env.CONTACT_TO_EMAIL;

  if (!apiKey) {
    console.error("[password-reset] falta RESEND_API_KEY");
    return;
  }

  const greeting = name ? `Hi ${name},` : "Hi,";

  const text = [
    greeting,
    "",
    "Someone asked to reset the password of your Pato Turri account. If it was you, open this link to choose a new one:",
    "",
    link,
    "",
    "It works once and expires in one hour. If you did not ask for this, ignore this email: your password stays as it is.",
    "",
    "Pato Turri",
  ].join("\n");

  const html = shell(`
  ${masthead()}
  <tr><td style="border-top:1px solid ${LINE};padding:22px 0 0">
    <h1 style="font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 14px;color:${INK}">Choose a new password</h1>
    <p style="margin:0 0 14px">${escape(greeting)}</p>
    <p style="margin:0 0 22px">Someone asked to reset the password of your Pato Turri account. If it was you, choose a new one here:</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${INK}">
      <a href="${escape(link)}" style="display:inline-block;padding:14px 22px;color:${PAPER};text-decoration:none;font-size:15px">Choose a new password</a>
    </td></tr></table>
    <p style="color:${MUTED};font-size:13px;margin:22px 0 0">The link works once and expires in one hour. If you did not ask for this, ignore this email — your password stays as it is.</p>
    <p style="color:${MUTED};font-family:${MONO};font-size:11px;margin:18px 0 0;word-break:break-all">${escape(link)}</p>
  </td></tr>
  <tr><td style="border-top:1px solid ${LINE};padding:18px 0 0;margin-top:22px">
    <p style="color:${ACCENT};font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin:22px 0 0">patoturri.com</p>
  </td></tr>`);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Pato Turri <${from}>`,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject: "Reset your password",
      text,
      html,
    });

    if (error) {
      console.error("[password-reset] no salió el mail:", error);
    }
  } catch (error) {
    console.error("[password-reset] no salió el mail:", error);
  }
}
