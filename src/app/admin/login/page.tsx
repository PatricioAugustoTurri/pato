import { Suspense } from "react";
import AuthWall from "@/components/AuthWall";
import AuthFormSkeleton from "@/components/AuthFormSkeleton";
import AdminLoginForm from "./components/AdminLoginForm";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/* La misma sala que /login, con la pared en tinta plena y sin obra: una puerta
   privada no gasta una fotografía del catálogo, y acá no hay a quién
   persuadir. Tampoco lleva Google: los administradores se crean a mano
   (`scripts/create-admin.mjs`) o se promueven desde /admin/customers, así que
   la única llave es la contraseña. */
export default function AdminLoginPage() {
  return (
    <section className="auth-room is-dark-room">
      <AuthWall title="Admin." lead="The catalogue, the orders and the customers." />
      <div className="auth-counter">
        <Suspense fallback={<AuthFormSkeleton fields={2} />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </section>
  );
}
