import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pato Turri | Contact",
  description: "Write with questions about your order, new collections, or anything else.",
  openGraph: {
    title: "Pato Turri | Contact",
    description: "Write with questions about your order, new collections, or anything else.",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
