import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About the Photographer",
  description:
    "Five years, four continents, and the people who opened their doors: the story behind Pato Turri's travel photographs.",
  path: "/about",
  type: "article",
});
export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}