"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useCart from "@/hooks/use-cart";
import { track } from "@/lib/analytics";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const removeAll = useCart((state) => state.removeAll);
  const { status } = useSession();
  const signedIn = status === "authenticated";

  useEffect(() => {
    if (sessionId) {
      /* Antes de vaciar: el evento lleva cuántas obras había, y después de
         `removeAll` el carrito ya no lo sabe. Solo con `session_id`, que es lo
         que Stripe agrega al volver de un pago; entrar a mano a esta dirección
         no cuenta como venta. */
      track("purchase", { works: useCart.getState().items.length });
      removeAll();
    }
  }, [sessionId, removeAll]);

  return (
    <main className="cart-room is-empty is-dark-room">
      <div className="cart-note">
        <h1>
          Your order is <i>in.</i>
        </h1>
        {/* La confirmacion por mail existe: la manda el webhook cuando Stripe
            confirma el cobro, al email que se dejo en la pagina de pago. Para
            quien compro sin cuenta esa es la unica constancia, asi que se dice
            donde buscarla. Con cuenta, ademas, el pedido esta en /account. */}
        <p>
          The payment went through and the order is recorded. A confirmation with the
          order number is on its way to the email you gave at checkout
          {signedIn ? ", and the order is in your account now" : ""}. For anything about
          it, write to <a href="mailto:info@patoturri.com">info@patoturri.com</a> — the
          same person who took the photographs reads it.
        </p>
        {/* Solo con sesion: sin ella /account es una puerta de acceso, y un
            pedido hecho sin cuenta no aparece ahi. */}
        {signedIn && (
          <Link href="/account" className="text-link">
            See your order <span aria-hidden="true">↗</span>
          </Link>
        )}
        <Link href="/shop" className="text-link">
          Keep looking <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
