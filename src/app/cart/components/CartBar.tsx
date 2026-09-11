"use client";

import { useEffect, useState, type RefObject } from "react";
import { formatPrice } from "@/lib/money";
import type { Checkout } from "../use-checkout";

/* En el telefono el mostrador queda al pie de la lista: con tres copias en el
   carrito, pagar se va de la pantalla y no vuelve hasta el final del scroll.
   Esta barra aparece cuando el boton real sale de vista y se va cuando vuelve —
   nunca se ven las dos juntas. Es el mismo patron que la pagina de la obra ya
   usa para su boton de agregar. En escritorio no existe: ahi el mostrador es
   pegajoso y el boton nunca se va. */
export default function CartBar({
  subtotal,
  prints,
  checkout,
  watch,
}: {
  subtotal: number;
  prints: number;
  checkout: Checkout;
  watch: RefObject<HTMLButtonElement | null>;
}) {
  const [offScreen, setOffScreen] = useState(false);

  useEffect(() => {
    const node = watch.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setOffScreen(!entry.isIntersecting),
      { rootMargin: "0px 0px -72px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <div className="cart-bar" data-visible={offScreen ? "" : undefined} aria-hidden={!offScreen}>
      <span className="cart-bar-what">
        <b>{prints} {prints === 1 ? "print" : "prints"}</b>
        <span>{formatPrice(subtotal)}</span>
      </span>
      <button
        type="button"
        onClick={checkout.start}
        disabled={checkout.disabled}
        tabIndex={offScreen ? 0 : -1}
      >
        {checkout.isRedirecting ? "Redirecting…" : "Checkout"}
      </button>
    </div>
  );
}
