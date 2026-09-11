import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pato Turri | Shop",
  description: "Travel photography prints, made to be lived slowly.",
  keywords: ["travel photography", "fine art prints", "street photography", "Malaysia photography", "night market photography"],
  authors: [{ name: "Pato Turri" }],
  openGraph: {
    title: "Pato Turri | Photographs That Take You Far",
    description: "Travel photography prints, made to be lived slowly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pato Turri | Photographs That Take You Far",
    description: "Travel photography prints, made to be lived slowly.",
  },
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}