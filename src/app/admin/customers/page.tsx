"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import AdminNav from "../components/AdminNav";
import CustomersList from "./components/CustomersList";
import CustomersTableSkeleton from "./components/CustomersTableSkeleton";
import type { AdminUser, UserRole } from "./components/types";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    axios
      .get<AdminUser[]>("/api/admin/users")
      .then((response) => {
        if (isMounted) {
          setUsers(response.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No se pudieron cargar las cuentas.");
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

  const handleRoleChange = async (userId: number, role: UserRole) => {
    try {
      await axios.patch(`/api/admin/users/${userId}`, { role });
      setUsers((current) => current.map((user) => (user.id === userId ? { ...user, role } : user)));
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      throw new Error(message || "No se pudo actualizar el rol.");
    }
  };

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader
        title={<>Gestionar <i>clientes.</i></>}
        description="Revisá las cuentas registradas y asigná roles cuando haga falta."
        icon={<Users aria-hidden="true" />}
      />
      {loadError && <p className="admin-feedback error">{loadError}</p>}
      {isLoading ? (
        <CustomersTableSkeleton />
      ) : (
        <CustomersList users={users} onRoleChange={handleRoleChange} />
      )}
    </main>
  );
}
