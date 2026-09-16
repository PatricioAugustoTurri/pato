"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Fotografías" },
  { href: "/admin/collections", label: "Colecciones" },
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
