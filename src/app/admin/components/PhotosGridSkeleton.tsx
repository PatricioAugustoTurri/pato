import { Skeleton } from "@/components/ui/skeleton";

export default function PhotosGridSkeleton() {
  return (
    <div className="admin-photo-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="admin-photo-card" key={index}>
          <Skeleton className="rounded-none" style={{ aspectRatio: "1.25", width: "100%" }} />
          <div className="admin-photo-card-content">
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
