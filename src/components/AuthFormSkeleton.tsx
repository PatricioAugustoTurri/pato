import { Skeleton } from "@/components/ui/skeleton";

export default function AuthFormSkeleton() {
  return (
    <section className="auth-page">
      <div className="auth-form-wrap">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-10 w-48 mb-7" />
        <div className="contact-form">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </section>
  );
}
