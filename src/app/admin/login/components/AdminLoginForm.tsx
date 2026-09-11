"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/callback-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"), "/admin");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("That email and password don't match. Check both and try again.");
      setIsSubmitting(false);
      return;
    }

    /* La contraseña puede ser correcta y la cuenta no ser de admin. Sin esta
       comprobacion el formulario aceptaba, `proxy.ts` rebotaba a la home y el
       visitante quedaba en la portada sin ninguna explicacion. Se deshace la
       sesion recien abierta: la abrio esta puerta, que no era la suya. */
    const session = await getSession();
    if (session?.user?.role !== "admin") {
      await signOut({ redirect: false });
      setError("That account isn't an administrator. Sign in at /login instead.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = callbackUrl;
  };

  return (
    <div className="auth-counter-inner">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "admin-login-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "admin-login-error" : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && (
          <span className="auth-error" id="admin-login-error" role="alert">
            {error}
          </span>
        )}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
