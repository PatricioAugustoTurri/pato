"use client";

import { useRef, useState } from "react";
import useCart from "@/hooks/use-cart";
import { shippingRate, type ShippingRegion } from "@/lib/shipping";
import CartBar from "./components/CartBar";
import CartCount from "./components/CartCount";
import CartCounter from "./components/CartCounter";
import CartEmpty from "./components/CartEmpty";
import CartList from "./components/CartList";
import { CartCounterSkeleton, CartLinesSkeleton } from "./components/CartSkeleton";
import { useCheckout } from "./use-checkout";
import { useHydrated } from "./use-hydrated";

export default function CartPage() {
  const items = useCart((state) => state.items);
  const removeItem = useCart((state) => state.removeItem);
  const setQuantity = useCart((state) => state.setQuantity);

  const hydrated = useHydrated();
  const checkoutRef = useRef<HTMLButtonElement>(null);
  /* Italia por defecto porque es desde donde se despacha y de donde viene la
     mayoria de los pedidos; la otra zona esta a un clic y ninguna de las dos
     esta preseleccionada de forma invisible: la fila elegida se ve. */
  const [region, setRegion] = useState<ShippingRegion>("it");
  const checkout = useCheckout(items, region);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.attributes?.price ?? item.price) * item.quantity,
    0,
  );
  const prints = items.reduce((sum, item) => sum + item.quantity, 0);
  const works = new Set(items.map((item) => item.photoId)).size;

  if (!hydrated) {
    return (
      <main className="cart-room is-dark-room">
        <div className="cart-wall">
          <CartCount />
          <h1>Cart</h1>
          <CartLinesSkeleton />
        </div>
        <CartCounterSkeleton />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="cart-room is-empty is-dark-room">
        <CartEmpty />
      </main>
    );
  }

  return (
    <main className="cart-room is-dark-room">
      <div className="cart-wall">
        {/* La ranura que el sitio reserva para la linea mono lleva dato, no una
            etiqueta: con una copia de una obra, "1 PRINT · 1 WORK" seria el
            rotulo decorativo que no queremos, y las obras solo se nombran
            cuando son menos que las copias, que es cuando el numero informa
            (cuatro copias de dos obras).

            La ranura SE DIBUJA SIEMPRE, aunque este vacia, y tambien en el
            esqueleto: si apareciera y desapareciera, el titulo y la lista
            entera saltarian treinta pixeles cuando localStorage contesta, que
            es el mismo parpadeo que esta pagina vino a sacar. */}
        <CartCount prints={prints} works={works} />
        <h1>Cart</h1>

        <CartList items={items} onRemove={removeItem} onQuantity={setQuantity} />
      </div>

      <CartCounter
        subtotal={subtotal}
        region={region}
        onRegionChange={setRegion}
        checkout={checkout}
        buttonRef={checkoutRef}
      />

      <CartBar
        subtotal={subtotal + shippingRate(region).amount / 100}
        prints={prints}
        checkout={checkout}
        watch={checkoutRef}
      />
    </main>
  );
}
