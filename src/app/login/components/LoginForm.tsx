"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/callback-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordField from "@/components/PasswordField";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"), "/");

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
      /* El servidor no dice cuál de los dos falló, y está bien que no lo diga:
         confirmar que un email existe es filtrar la lista de clientes. El
         mensaje nombra el problema y la salida sin revelar cuál era. */
      setError("That email and password don't match. Check both and try again.");
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
            aria-describedby={error ? "login-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {/* `role="alert"` y no un span suelto: el error aparece después de
            enviar, cuando el foco sigue en el botón, así que un lector de
            pantalla no volvería a pasar por él nunca. */}
        {error && (
          <span className="auth-error" id="login-error" role="alert">
            {error}
          </span>
        )}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="auth-switch">
        No account yet?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Create one</Link>
      </p>
    </div>
  );
}
