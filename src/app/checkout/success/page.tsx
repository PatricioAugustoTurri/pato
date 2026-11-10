"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useCart from "@/hooks/use-cart";
import { track } from "@/lib/analytics";
import { DONATE_URL } from "@/lib/digital";

type DownloadState = {
  paid: boolean;
  ships: boolean;
  links: { token: string; title: string; path: string }[];
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

/* Stripe vuelve acá apenas se paga, y el webhook que marca el pedido y crea los
   links de descarga puede llegar unos segundos después. Se pregunta cada 1,5 s
   durante medio minuto; si no llega, el mail igual lleva los links. */
function useDownloads(sessionId: string | null): DownloadState | null {
  const [state, setState] = useState<DownloadState | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    let tries = 0;

    const ask = async () => {
      try {
        const response = await fetch(`/api/checkout/descargas?session_id=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as DownloadState;
        if (stopped) return;
        setState(data);
        if (data.paid) return;
      } catch {
        /* Sin red, se vuelve a intentar abajo. */
      }
      tries += 1;
      if (!stopped && tries < 20) setTimeout(ask, 1500);
    };

    ask();
    return () => {
      stopped = true;
    };
  }, [sessionId]);

  return state;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const removeAll = useCart((state) => state.removeAll);
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const downloads = useDownloads(sessionId);
  const links = downloads?.links ?? [];
  /* Mientras no se sabe, se habla de un pedido común: es lo que era esta
     página antes del archivo digital, y no promete nada que no llegue. */
  const onlyFiles = downloads ? !downloads.ships : false;
  const waitingForFiles = downloads !== null && !downloads.paid;

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
          {onlyFiles ? (
            <>
              Thank you. <i>It&apos;s yours.</i>
            </>
          ) : (
            <>
              Your order is <i>in.</i>
            </>
          )}
        </h1>

        {/* Los archivos, arriba de todo: es lo único de esta pantalla que hay
            que hacer. */}
        {links.length > 0 && (
          <div className="success-downloads">
            {links.map((link) => (
              <Link key={link.token} href={link.path} className="buy-add download-button">
                <span>
                  Download <b>{link.title}</b>
                </span>
                <b aria-hidden="true">↓</b>
              </Link>
            ))}
          </div>
        )}
        {waitingForFiles && (
          <p className="success-waiting" role="status">
            Confirming the payment with Stripe — your download will appear here in a moment.
          </p>
        )}

        {/* La confirmacion por mail existe: la manda el webhook cuando Stripe
            confirma el cobro, al email que se dejo en la pagina de pago. Para
            quien compro sin cuenta esa es la unica constancia, asi que se dice
            donde buscarla. Con cuenta, ademas, el pedido esta en /account. */}
        <p>
          {onlyFiles
            ? "Buying the file is a contribution to the bike ride from Japan to Portugal. The same download links are on their way to the email you gave at checkout"
            : "The payment went through and the order is recorded. A confirmation with the order number is on its way to the email you gave at checkout"}
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
        {links.length > 0 && (
          <a href={DONATE_URL} className="text-link" target="_blank" rel="noreferrer">
            Buy me something on the road <span aria-hidden="true">↗</span>
          </a>
        )}
        <Link href="/shop" className="text-link">
          Keep looking <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
