import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersGridSkeleton() {
  return (
    <div className="admin-order-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <article className="admin-order-card" key={index}>
          <header className="admin-order-card-header">
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-9 w-36" />
          </header>

          <section className="admin-order-card-buyer">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-3 w-40 mb-2" />
            <Skeleton className="h-3 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </section>

          <section className="admin-order-card-items">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </section>

          <footer className="admin-order-card-totals">
            <Skeleton className="h-3 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </footer>
        </article>
      ))}
    </div>
  );
}
