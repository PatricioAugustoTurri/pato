"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminOrder } from "./types";

const STATUS_LABELS: Record<string, string> = {
  paid: "Pagado",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
};

function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} EUR`;
}

function formatAddress(address: AdminOrder["shippingAddress"]): string {
  if (!address) return "Sin dirección de envío.";
  return [address.line1, address.line2, address.postal_code, address.city, address.state, address.country]
    .filter(Boolean)
    .join(", ");
}

type OrderCardProps = {
  order: AdminOrder;
  onStatusChange: (orderId: number, status: string) => Promise<void>;
};

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleChange = async (status: string | null) => {
    if (!status) return;
    setSaveState("saving");
    try {
      await onStatusChange(order.id, status);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <article className="admin-order-card">
      <header className="admin-order-card-header">
        <div>
          <strong>Pedido #{order.id}</strong>
          <small>{new Date(order.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</small>
        </div>
        <Select value={order.status} onValueChange={handleChange}>
          <SelectTrigger className="admin-order-status-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <section className="admin-order-card-buyer">
        <p className="eyebrow">Comprador</p>
        <p>{order.customerName ?? "—"}</p>
        <p>{order.email ?? "—"}</p>
        <p>{order.customerPhone ?? "—"}</p>
        <p>{formatAddress(order.shippingAddress)}</p>
      </section>

      <section className="admin-order-card-items">
        <p className="eyebrow">Productos</p>
        <ul>
          {order.items.map((item, index) => (
            <li key={index}>
              <span>{item.name ?? `Foto #${item.photoId}`} ({item.size}) × {item.quantity}</span>
              <span>{formatCents(item.unitAmountCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="admin-order-card-totals">
        <p>Envío: {order.shippingOption ?? "—"} · {formatCents(order.shippingAmountCents)}</p>
        <p><strong>Total: {formatCents(order.amountTotalCents ?? order.totalCents)}</strong></p>
        {saveState === "saving" && <Skeleton className="h-4 w-16" />}
        {saveState === "saved" && <span className="admin-feedback success">Guardado.</span>}
        {saveState === "error" && <span className="admin-feedback error">No se pudo guardar.</span>}
      </footer>
    </article>
  );
}
