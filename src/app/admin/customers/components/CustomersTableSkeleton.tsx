import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersTableSkeleton() {
  return (
    <div className="admin-customer-table">
      <div className="admin-customer-row admin-customer-row-head">
        <span>Nombre</span>
        <span>Email</span>
        <span>Se registró</span>
        <span>Rol</span>
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="admin-customer-row" key={index}>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      ))}
    </div>
  );
}
