"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { signIn } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/callback-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordField from "@/components/PasswordField";

export default function RegisterForm() {
  const [name, setName] = useState("");
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

    try {
      await axios.post("/api/register", { name, email, password });

      const result = await signIn("credentials", { email, password, redirect: false });

      if (!result || result.error) {
        setError("Your account was created, but we couldn't sign you in. Try signing in.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = callbackUrl;
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || "We couldn't create the account. Try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-counter-inner">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="name">Name</label>
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
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "register-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            minLength={8}
            aria-describedby="register-password-hint"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {/* El mínimo se dice antes, no después. Descubrirlo por rechazo es
              pedirle al visitante que adivine y después corrija. */}
          <span className="auth-hint" id="register-password-hint">
            At least 8 characters
          </span>
        </div>
        {error && (
          <span className="auth-error" id="register-error" role="alert">
            {error}
          </span>
        )}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in</Link>
      </p>
    </div>
  );
}
