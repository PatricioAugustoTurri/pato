"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <section className="auth-page">
        <div className="auth-form-wrap">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-11 w-56 mb-3" />
          <Skeleton className="h-4 w-40 mb-7" />
          <Skeleton className="h-11 w-36" />
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="auth-page">
        <div className="auth-form-wrap">
          <p className="eyebrow">Mi cuenta</p>
          <h1>No iniciaste sesión.</h1>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-form-wrap">
        <p className="eyebrow">Mi cuenta</p>
        <h1>Hola, {session.user?.name}.</h1>
        <p className="auth-detail">{session.user?.email}</p>
        <Button
          type="button"
          className="auth-submit"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Cerrar sesión
        </Button>
      </div>
    </section>
  );
}
