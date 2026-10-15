import { Suspense } from "react";
import { getPreferredPhotos } from "@/lib/photos";
import AuthWall from "@/components/AuthWall";
import AuthFormSkeleton from "@/components/AuthFormSkeleton";
import ResetForm from "./components/ResetForm";

export const metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your Pato Turri account.",
  /* Ni índice ni seguimiento: la dirección lleva un token en la URL. */
  robots: { index: false, follow: false },
  /* El token no puede viajar en el `Referer` hacia ningún otro sitio: la
     pared enlaza a la obra, y Cloudinary sirve la imagen. */
  referrer: "no-referrer" as const,
};

/* Misma pared que /forgot-password: es la segunda mitad del mismo trámite, y
   cambiar la fotografía entre el pedido y el cambio haría pensar que se salió
   del camino. */
export default async function ResetPasswordPage() {
  const photos = await getPreferredPhotos(3);
  const photo = photos[2] ?? photos[0];

  return (
    <section className="auth-room is-dark-room">
      <AuthWall
        title={
          <>
            Choose a new <i>password.</i>
          </>
        }
        lead="At least eight characters. Once it is saved, the link in the email stops working."
        photo={photo}
      />
      <div className="auth-counter">
        <Suspense fallback={<AuthFormSkeleton fields={1} hint switchLink />}>
          <ResetForm />
        </Suspense>
      </div>
    </section>
  );
}
