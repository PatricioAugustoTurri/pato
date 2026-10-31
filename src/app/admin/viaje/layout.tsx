import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./viaje.css";

/* "Agregar a pantalla de inicio" abre el diario directo, como una app. */
export const metadata: Metadata = {
  title: "El viaje",
  manifest: "/viaje.webmanifest",
  appleWebApp: { capable: true, title: "El viaje", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#eeebe4" };

export default function ViajeLayout({ children }: { children: ReactNode }) {
  return children;
}
