import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pato Turri | My Story",
  description: "Five years, four continents, and the people who opened their doors: the story behind Pato Turri's photographs.",
  keywords: ["travel photography", "fine art prints", "street photography", "Malaysia photography", "night market photography"],
  authors: [{ name: "Pato Turri" }],
  openGraph: {
    title: "My Story | Pato Turri",
    description: "Five years, four continents, and the people who opened their doors: the story behind Pato Turri's photographs.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Story | Pato Turri",
    description: "Five years, four continents, and the people who opened their doors: the story behind Pato Turri's photographs.",
  },
};
export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}