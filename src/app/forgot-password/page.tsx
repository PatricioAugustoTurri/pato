import { getPreferredPhotos } from "@/lib/photos";
import AuthWall from "@/components/AuthWall";
import ForgotForm from "./components/ForgotForm";

export const metadata = {
  title: "Reset your password",
  description: "Get a link to choose a new password for your Pato Turri account.",
  robots: { index: false, follow: true },
};

/* La tercera puerta de cuenta, con la misma pared y el mismo mostrador que
   /login y /register. Toma la tercera obra preferida por la misma razón que el
   registro toma la segunda: pasar de una puerta a otra tiene que verse. */
export default async function ForgotPasswordPage() {
  const photos = await getPreferredPhotos(3);
  const photo = photos[2] ?? photos[0];

  return (
    <section className="auth-room is-dark-room">
      <AuthWall
        title={
          <>
            Forgot your <i>password?</i>
          </>
        }
        lead="Write the email of your account. A link to choose a new one arrives there."
        photo={photo}
      />
      <div className="auth-counter">
        <ForgotForm />
      </div>
    </section>
  );
}
