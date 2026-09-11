import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Checkout",
  /* Las dos pantallas que devuelve Stripe. No hay nada que indexar: una
     confirmación sin pedido detrás no le sirve a nadie que llegue de Google. */
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
