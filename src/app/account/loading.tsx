import { Skeleton } from "@/components/ui/skeleton";

/* La espera se mudó del cliente a la navegación al pasar la página a servidor.
   Usa las clases reales con `.is-ghost`, la misma disciplina que
   `AuthFormSkeleton`: las medidas las calcula el mismo CSS que gobierna la
   página de verdad, así las dos versiones no pueden divergir. */
export default function AccountLoading() {
  return (
    <main className="order-room is-dark-room">
      <div className="order-wall">
        <p className="order-count" />
        <h1>
          Your <i>orders.</i>
        </h1>

        <div className="order-ledger">
          {[0, 1].map((index) => (
            <section className="order" key={index}>
              <div className="order-head">
                <Skeleton className="h-[13px] w-20" />
                <Skeleton className="h-[11px] w-24" />
              </div>
              <div className="order-lines">
                <article className="order-line is-ghost">
                  <div className="order-line-plate">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="order-line-what">
                    <Skeleton className="mb-[11px] h-[23px] w-3/4" />
                    <Skeleton className="h-[13px] w-40" />
                  </div>
                  <Skeleton className="h-[16px] w-12" />
                </article>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="order-counter">
        <div className="order-counter-inner">
          <p className="order-counter-legend">Account</p>
          <Skeleton className="mb-[11px] h-[27px] w-40" />
          <Skeleton className="h-[16px] w-52" />
        </div>
      </div>
    </main>
  );
}
