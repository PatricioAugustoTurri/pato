import type { CustomerOrder, OrderStatus } from "@/lib/orders";

/* Una palabra por estado. Sin `updated_at` en la base no hay fecha de
   transición que mostrar, así que nada de "enviado el 3 de marzo". */
const LABELS: Record<OrderStatus, string> = {
  pending: "Not paid",
  paid: "Paid",
  processing: "In preparation",
  shipped: "Shipped",
  delivered: "Delivered",
};

/* Una hora. Un pedido recién creado sigue en `pending` hasta que llega el
   webhook de Stripe, y eso tarda un instante: sin esta ventana, quien vuelve
   del pago y entra acá enseguida leería "Not paid" justo después de que la
   pantalla anterior le dijera que el pago entró. Bajo la ventana, "awaiting
   confirmation" es cierto tanto si el pago está entrando como si se abandonó
   hace un minuto. */
const CONFIRMATION_WINDOW_MS = 60 * 60 * 1000;

export function statusLabel(order: CustomerOrder, now: number): string {
  if (order.status === "pending" && now - order.createdAt.getTime() < CONFIRMATION_WINDOW_MS) {
    return "Awaiting confirmation";
  }
  return LABELS[order.status];
}

/* Zona fijada: la tienda despacha desde Italia, y una fecha sin zona se corre
   un día según dónde esté desplegado el servidor. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Rome",
});

export function orderDate(value: Date): string {
  return DATE_FORMAT.format(value);
}

export function orderNumber(id: number): string {
  return `No. ${String(id).padStart(4, "0")}`;
}
