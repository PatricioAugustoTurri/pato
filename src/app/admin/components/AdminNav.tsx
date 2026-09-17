"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* El orden es el del trabajo, no el alfabético: primero se carga la obra,
   después se la agrupa en una colección, después se decide qué sale en la
   portada y cuánto cuesta. Pedidos y clientes al final, que es lo que se mira
   cuando ya está todo publicado. */
const LINKS = [
  { href: "/admin", label: "Fotografías" },
  { href: "/admin/collections", label: "Colecciones" },
  { href: "/admin/featured", label: "Portada" },
  { href: "/admin/sizes", label: "Precios" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/customers", label: "Clientes" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-nav-link${pathname === link.href ? " is-active" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
