"use client";

import { useState } from "react";
import axios from "axios";
import { track } from "@/lib/analytics";
import type { CartItem } from "@/hooks/use-cart";
import type { ShippingRegion } from "@/lib/shipping";

/* El checkout se dispara desde dos lugares —el boton del mostrador y la barra
   del pulgar en el telefono— y los dos tienen que compartir el mismo estado: si
   estan los dos en la pantalla con banderas distintas, uno dice "Redirecting"
   mientras el otro sigue ofreciendo empezar de nuevo. Vive en la pagina y baja
   a los dos. */
export type Checkout = ReturnType<typeof useCheckout>;

export function useCheckout(items: CartItem[], region: ShippingRegion) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setIsRedirecting(true);

    /* Comprar no pide cuenta: el boton va directo a Stripe. El evento sale
       antes del pedido porque, si el checkout falla, igual se quiere saber
       cuanta gente llego a intentarlo. */
    track("checkout_start", {
      region,
      works: items.length,
      prints: items.reduce((sum, item) => sum + item.quantity, 0),
    });

    try {
      const { data } = await axios.post<{ url?: string; error?: string }>("/api/checkout", {
        items: items.map((item) => ({
          photoId: item.photoId,
          size: item.size,
          quantity: item.quantity,
        })),
        region,
      });

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError(data.error || "We could not start the payment. Please try again.");
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || "We could not start the payment. Please try again.");
    } finally {
      setIsRedirecting(false);
    }
  };

  return {
    start,
    error,
    isRedirecting,
    disabled: isRedirecting || items.length === 0,
  };
}
