import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsSkeleton() {
  return (
    <div className="admin-collections">
      {Array.from({ length: 2 }).map((_, index) => (
        <div className="admin-collection" key={index}>
          <div className="admin-collection-head">
            <div>
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-10 w-56 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="rounded-none" style={{ aspectRatio: "1.25", width: "210px" }} />
          </div>
          <div className="admin-collection-strip">
            {Array.from({ length: 6 }).map((__, thumb) => (
              <Skeleton className="rounded-none" key={thumb} style={{ aspectRatio: "1", width: "100%" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
