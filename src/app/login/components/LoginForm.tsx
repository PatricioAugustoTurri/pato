"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

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
      setError("Email o contraseña incorrectos.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = callbackUrl;
  };

  return (
    <section className="auth-page">
      <div className="auth-form-wrap">
        <h1>Iniciar sesión</h1>
        {googleEnabled && (
          <GoogleSignIn callbackUrl={callbackUrl} label="Continuar con Google" />
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <span className="auth-error">{error}</span>}
          <Button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
        <p className="auth-switch">
          ¿No tenés cuenta?{" "}
          <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Registrate</Link>
        </p>
      </div>
    </section>
  );
}
