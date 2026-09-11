"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Package } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import AdminNav from "../components/AdminNav";
import OrdersList from "./components/OrdersList";
import OrdersGridSkeleton from "./components/OrdersGridSkeleton";
import type { AdminOrder } from "./components/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const { data } = await axios.get<AdminOrder[]>("/api/admin/orders");
      setOrders(data);
      setLoadError(null);
    } catch {
      setLoadError("No se pudieron cargar los pedidos.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    axios
      .get<AdminOrder[]>("/api/admin/orders")
      .then((response) => {
        if (isMounted) {
          setOrders(response.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No se pudieron cargar los pedidos.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (orderId: number, status: string) => {
    await axios.patch(`/api/admin/orders/${orderId}`, { status });
    await loadOrders();
  };

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader
        title={<>Gestionar <i>pedidos.</i></>}
        description="Revisá los pedidos pagados y actualizá su estado de envío."
        icon={<Package aria-hidden="true" />}
      />
      {loadError && <p className="admin-feedback error">{loadError}</p>}
      {isLoading ? (
        <OrdersGridSkeleton />
      ) : (
        <OrdersList orders={orders} onStatusChange={handleStatusChange} />
      )}
    </main>
  );
}
