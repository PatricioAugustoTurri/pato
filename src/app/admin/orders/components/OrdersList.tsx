import type { AdminOrder } from "./types";
import OrderCard from "./OrderCard";

type OrdersListProps = {
  orders: AdminOrder[];
  onStatusChange: (orderId: number, status: string) => Promise<void>;
};

export default function OrdersList({ orders, onStatusChange }: OrdersListProps) {
  return (
    <section className="admin-library">
      <div className="admin-library-heading">
        <div>
          <p className="eyebrow">Ventas</p>
          <h2>Pedidos pagados</h2>
        </div>
      </div>
      {orders.length === 0 ? (
        <p className="admin-empty">Todavía no hay pedidos pagados.</p>
      ) : (
        <div className="admin-order-grid">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </section>
  );
}
