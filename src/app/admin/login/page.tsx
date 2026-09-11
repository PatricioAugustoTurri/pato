"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function AdminLoginSkeleton() {
  return (
    <main className="admin-page">
      <div className="admin-form" style={{ margin: "0 auto", maxWidth: 420 }}>
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="admin-grid" style={{ marginTop: 24 }}>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="h-11 w-full mt-5" />
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginSkeleton />}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

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
    <main className="admin-page">
      <form className="admin-form" onSubmit={handleSubmit} style={{ margin: "0 auto", maxWidth: 420 }}>
        <p className="eyebrow">Acceso administrador</p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>Iniciar sesión</h1>
        <div className="admin-grid" style={{ marginTop: 24 }}>
          <div className="admin-field">
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
          <div className="admin-field">
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
        </div>
        {error && <p className="admin-feedback error">{error}</p>}
        <Button type="submit" className="admin-submit" disabled={isSubmitting} style={{ marginTop: 20 }}>
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </main>
  );
}
