import { Suspense } from "react";
import { getPreferredPhotos } from "@/lib/photos";
import AuthWall from "@/components/AuthWall";
import AuthFormSkeleton from "@/components/AuthFormSkeleton";
import RegisterForm from "./components/RegisterForm";

export const metadata = {
  title: "Create an account",
  description: "Create a Pato Turri account to order prints.",
  robots: { index: false, follow: true },
};

/* La puerta gemela de /login, con la misma pared y el mismo mostrador. Pide
   dos obras y se queda con la segunda: las dos puertas se enlazan entre sí, y
   verlas con la misma fotografía haría dudar de si el clic hizo algo. Si el
   catálogo devuelve una sola, cae en ella; si no devuelve ninguna, la pared
   es tinta plena. */
export default async function RegisterPage() {
  const photos = await getPreferredPhotos(2);
  const photo = photos[1] ?? photos[0];

  return (
    <section className="auth-room is-dark-room">
      <AuthWall
        title={
          <>
            Create an <i>account.</i>
          </>
        }
        lead="One field more than signing in, and checkout stops asking."
        photo={photo}
      />
      <div className="auth-counter">
        <Suspense fallback={<AuthFormSkeleton fields={3} hint switchLink />}>
          <RegisterForm />
        </Suspense>
      </div>
    </section>
  );
}
