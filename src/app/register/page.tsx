import { Suspense } from "react";
import { googleEnabled } from "@/lib/auth";
import AuthFormSkeleton from "@/components/AuthFormSkeleton";
import RegisterForm from "./components/RegisterForm";

/* Página de servidor: es la única que puede leer si Google está configurado.
   Sin credenciales cargadas el botón no se dibuja, en vez de dibujarse y
   llevar a una pantalla de error de OAuth. */
export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <RegisterForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
