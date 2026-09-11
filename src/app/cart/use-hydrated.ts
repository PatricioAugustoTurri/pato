"use client";

import { useSyncExternalStore } from "react";
import useCart from "@/hooks/use-cart";

/* El carrito vive en localStorage y el servidor no lo conoce, asi que el primer
   render SIEMPRE es un carrito vacio: sin esta guarda, un carrito con tres
   copias abria diciendo "Nothing here yet" y se corregia solo un instante
   despues.

   `persist` avisa cuando termino de leer el storage, asi que esto es una
   suscripcion a un sistema externo de verdad —no un `setState` dentro de un
   efecto, que ademas dispara un render en cascada. El snapshot del servidor es
   `false` a proposito: en el servidor no hay storage que leer, y devolver otra
   cosa seria prometer datos que ese HTML no tiene. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
