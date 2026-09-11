import { Suspense } from "react";
import { googleEnabled } from "@/lib/auth";
import AuthFormSkeleton from "@/components/AuthFormSkeleton";
import LoginForm from "./components/LoginForm";

/* Página de servidor: es la única que puede leer si Google está configurado.
   Sin credenciales cargadas el botón no se dibuja, en vez de dibujarse y
   llevar a una pantalla de error de OAuth. */
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
