import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  /* El sitio publico esta en ingles y el documento lo declara asi en la raiz,
     pero el panel sigue en castellano a proposito: es la herramienta del autor,
     no una pagina para el comprador. Esta marca evita que un lector de pantalla
     lea el castellano con fonemas ingleses. */
  return <div lang="es">{children}</div>;
}
