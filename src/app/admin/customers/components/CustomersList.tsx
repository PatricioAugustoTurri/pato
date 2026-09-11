"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser, UserRole } from "./types";

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Cliente",
  admin: "Administrador",
};

type CustomersListProps = {
  users: AdminUser[];
  onRoleChange: (userId: number, role: UserRole) => Promise<void>;
};

export default function CustomersList({ users, onRoleChange }: CustomersListProps) {
  return (
    <section className="admin-library">
      <div className="admin-library-heading">
        <div>
          <p className="eyebrow">Cuentas</p>
          <h2>Clientes registrados</h2>
        </div>
      </div>
      {users.length === 0 ? (
        <p className="admin-empty">Todavía no hay cuentas registradas.</p>
      ) : (
        <div className="admin-customer-table">
          <div className="admin-customer-row admin-customer-row-head">
            <span>Nombre</span>
            <span>Email</span>
            <span>Se registró</span>
            <span>Rol</span>
          </div>
          {users.map((user) => (
            <CustomerRow key={user.id} user={user} onRoleChange={onRoleChange} />
          ))}
        </div>
      )}
    </section>
  );
}

function CustomerRow({ user, onRoleChange }: { user: AdminUser; onRoleChange: CustomersListProps["onRoleChange"] }) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");

  const handleChange = async (role: string | null) => {
    if (!role) return;
    setSaveState("saving");
    try {
      await onRoleChange(user.id, role as UserRole);
      setSaveState("idle");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div className="admin-customer-row">
      <span>{user.name}</span>
      <span className="admin-customer-email">{user.email}</span>
      <span>{new Date(user.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}</span>
      <span>
        <Select value={user.role} onValueChange={handleChange}>
          <SelectTrigger className="admin-order-status-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {saveState === "saving" && <Skeleton className="h-4 w-16" />}
        {saveState === "error" && <span className="admin-feedback error">No se pudo cambiar.</span>}
      </span>
    </div>
  );
}
