import { Suspense } from "react";
import { getPreferredPhotos } from "@/lib/photos";
import AuthWall from "@/components/AuthWall";
import AuthFormSkeleton from "@/components/AuthFormSkeleton";
import LoginForm from "./components/LoginForm";

export const metadata = {
  title: "Sign in · Pato Turri",
  description: "Sign in to your Pato Turri account to check out.",
};

/* Página de servidor por dos razones: es la única que puede leer si Google
   está configurado —sin credenciales cargadas el botón no se dibuja, en vez de
   dibujarse y llevar a una pantalla de error de OAuth—, y es la que trae la
   obra de la pared. Solo el formulario suspende, porque solo él necesita los
   parámetros de la URL: la pared y el título salen enteros del servidor. */
export default async function LoginPage() {
  const [photo] = await getPreferredPhotos(1);

  return (
    <section className="auth-room is-dark-room">
      <AuthWall
        title={
          <>
            Sign <i>in.</i>
          </>
        }
        lead="Checkout asks for this first. An order has to belong to someone."
        photo={photo}
      />
      <div className="auth-counter">
        <Suspense fallback={<AuthFormSkeleton fields={2} switchLink />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
