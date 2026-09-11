import type { OrderAddress, OrderItemSnapshot, OrderStatus } from "@/lib/orders";

/* La forma de un pedido vive en `src/lib/orders.ts`, que es de donde sale
   también el libro del comprador. Acá quedan los alias históricos para no tocar
   cada componente del panel, y el tipo de la fila que la API del admin
   devuelve, que trae campos que el cliente no ve (teléfono, email, nombre). */
export type { OrderStatus };
export type AdminOrderItem = OrderItemSnapshot;
export type AdminOrderAddress = OrderAddress;

export type AdminOrder = {
  id: number;
  status: OrderStatus;
  items: AdminOrderItem[];
  totalCents: number;
  email: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: AdminOrderAddress | null;
  shippingOption: string | null;
  shippingAmountCents: number | null;
  amountTotalCents: number | null;
  createdAt: string;
};
