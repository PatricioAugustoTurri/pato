"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [name, setName] = useState("");
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

    try {
      await axios.post("/api/register", { name, email, password });

      const result = await signIn("credentials", { email, password, redirect: false });

      if (!result || result.error) {
        setError("Tu cuenta se creó, pero no pudimos iniciar sesión automáticamente. Intentá ingresar de nuevo.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = callbackUrl;
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || "No se pudo crear la cuenta.");
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-form-wrap">
        <h1>Crear una cuenta</h1>
        {googleEnabled && (
          <GoogleSignIn callbackUrl={callbackUrl} label="Registrarte con Google" />
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="name">Nombre</label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
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
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <span className="auth-error">{error}</span>}
          <Button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
        <p className="auth-switch">
          ¿Ya tenés cuenta?{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Iniciá sesión</Link>
        </p>
      </div>
    </section>
  );
}
