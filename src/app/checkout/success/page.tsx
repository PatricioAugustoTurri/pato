"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useCart from "@/hooks/use-cart";

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

  useEffect(() => {
    if (sessionId) {
      removeAll();
    }
  }, [sessionId, removeAll]);

  return (
    <main className="cart-room is-empty is-dark-room">
      <div className="cart-note">
        <h1>
          Your order is <i>in.</i>
        </h1>
        {/* La copia anterior prometia un email con los proximos pasos del
            envio. Ese mecanismo no existe: `resend` solo esta cableado al
            formulario de contacto, y el webhook de Stripe se limita a pasar el
            pedido a `paid`. Se dice lo que si es cierto — el pago entro, el
            pedido quedo registrado — y se nombra el canal que de verdad
            funciona. */}
        <p>
          The payment went through and the order is recorded — it is in your orders now.
          For anything about it, write to{" "}
          <a href="mailto:info@patoturri.com">info@patoturri.com</a> — the same person who
          took the photographs reads it.
        </p>
        {/* Decir "quedo registrado" sin dar donde verlo era abrir un circuito y
            dejarlo abierto: el pedido existia y el comprador no tenia forma de
            volver a el. Va primero porque es lo especifico de esta pantalla. */}
        <Link href="/account" className="text-link">
          See your order <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/shop" className="text-link">
          Keep looking <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
