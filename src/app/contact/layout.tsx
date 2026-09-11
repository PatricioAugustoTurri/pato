import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pato Turri | Contacto",
  description: "Escribinos por dudas sobre tu pedido, colecciones nuevas o cualquier otra consulta.",
  openGraph: {
    title: "Pato Turri | Contacto",
    description: "Escribinos por dudas sobre tu pedido, colecciones nuevas o cualquier otra consulta.",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
