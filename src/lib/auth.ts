import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

/**
 * Google entra solo si hay credenciales cargadas. Sin ellas el proveedor no se
 * registra: la puerta no existe, en vez de existir y fallar al empujarla. La
 * interfaz consulta lo mismo para decidir si dibuja el botón.
 */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/** Busca la cuenta del sitio por email. El email es la identidad; el proveedor
 *  es solo por dónde entró. */
async function findUserByEmail(email: string) {
  const { rows } = await pool.query<{ id: number; role: string }>(
    "SELECT id, role FROM users WHERE email = $1 LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const { rows } = await pool.query<{
          id: number;
          name: string;
          email: string;
          password_hash: string | null;
          role: string;
        }>(
          "SELECT id, name, email, password_hash, role FROM users WHERE email = $1 LIMIT 1",
          [email],
        );

        const user = rows[0];
        if (!user) {
          return null;
        }

        /* Cuenta creada al entrar con Google: no tiene contraseña y no se puede
           tomar por esta puerta. Sin esta guarda, bcrypt.compare contra un hash
           nulo sería el único freno, y eso es depender de un detalle de bcrypt
           para algo que es una regla del producto. */
        if (!user.password_hash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return null;
        }

        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Alta y vinculación de las cuentas de Google.
     *
     * Vincular por email es lo que espera cualquiera que se registró con
     * contraseña y después entra con Google: quiere SU cuenta, no una segunda.
     * Pero vincular por un email que nadie verificó sería regalar cuentas, así
     * que se exige `email_verified`. Google lo manda siempre; si no viene, se
     * rechaza la entrada en vez de asumir que sí.
     */
    signIn: async ({ account, profile }) => {
      if (account?.provider !== "google") {
        return true;
      }

      const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
      if (!email || profile?.email_verified !== true) {
        return false;
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return true;
      }

      /* Alta nueva: siempre `customer`, como el registro con contraseña. Un
         admin se promueve desde el panel, nunca por entrar con Google. */
      const name = typeof profile?.name === "string" && profile.name.trim() ? profile.name.trim() : email;
      await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, NULL, 'customer') ON CONFLICT (email) DO NOTHING",
        [name, email],
      );
      return true;
    },
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      /* El `user` que devuelve Google trae SU id, no el de la base. El id y el
         rol se resuelven contra `users`, que es la única fuente de roles. */
      if (account?.provider === "google" && typeof token.email === "string") {
        const row = await findUserByEmail(token.email.toLowerCase());
        if (row) {
          token.id = String(row.id);
          token.role = row.role;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? "customer";
      }
      return session;
    },
  },
});
