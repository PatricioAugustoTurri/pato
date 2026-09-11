import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  /* Una sola puerta: email y contraseña. Google se retiró por decisión del
     autor; con él se fueron su alta automática de cuentas y el puente que
     resolvía el id contra `users`. */
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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

        /* Filas heredadas de cuando existía el alta con Google: se guardaron sin
           contraseña. Ya no se crean más así, pero la guarda se queda: un hash
           nulo no puede autenticar, y dejar que eso dependa de cómo reacciona
           bcrypt ante un nulo es apoyar una regla del producto en un detalle de
           una librería. */
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
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
