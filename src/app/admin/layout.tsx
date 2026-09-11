import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Pato Turri",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
