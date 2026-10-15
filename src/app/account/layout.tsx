import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your orders",
  description: "Your orders: what you chose, what it cost, and where it went.",
  /* Página privada: no hay nada acá que un buscador deba indexar. */
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
