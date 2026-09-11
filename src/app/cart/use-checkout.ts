"use client";

import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/hooks/use-cart";

/* El checkout se dispara desde dos lugares —el boton del mostrador y la barra
   del pulgar en el telefono— y los dos tienen que compartir el mismo estado: si
   estan los dos en la pantalla con banderas distintas, uno dice "Redirecting"
   mientras el otro sigue ofreciendo empezar de nuevo. Vive en la pagina y baja
   a los dos. */
export type Checkout = ReturnType<typeof useCheckout>;

export function useCheckout(items: CartItem[]) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();

  const start = async () => {
    setError(null);

    if (status !== "authenticated") {
      router.push("/login?callbackUrl=%2Fcart");
      return;
    }

    setIsRedirecting(true);

    try {
      const { data } = await axios.post<{ url?: string; error?: string }>("/api/checkout", {
        items: items.map((item) => ({
          photoId: item.photoId,
          size: item.size,
          quantity: item.quantity,
        })),
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
    /* El redirect a /login era una sorpresa: se hacia click en pagar y la
       pantalla cambiaba a un formulario sin aviso. Con esto el boton lo dice
       antes. `loading` no cuenta como cerrado: mientras la sesion se resuelve
       no se promete ni una cosa ni la otra. */
    needsSignIn: status === "unauthenticated",
    disabled: isRedirecting || items.length === 0,
  };
}
