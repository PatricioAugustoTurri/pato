"use client";

import type { ReactNode } from "react";
import { LogOut, Upload } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type AdminHeaderProps = {
  title?: ReactNode;
  description?: string;
  icon?: ReactNode;
};

export default function AdminHeader({
  title = <>Cargar una <i>fotografía.</i></>,
  description = "Administra tus fotografías o agrega nuevas a la colección.",
  icon = <Upload aria-hidden="true" />,
}: AdminHeaderProps) {
  return (
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Panel privado</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div style={{ alignItems: "flex-end", display: "flex", flexDirection: "column", gap: 12 }}>
        {icon}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectTo: "/admin/login" })}
        >
          <LogOut aria-hidden="true" /> Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
