"use client";

import type { RefObject } from "react";
import { formatPrice } from "@/lib/money";
import { SHIPPING_RATES } from "@/lib/shipping";
import type { Checkout } from "../use-checkout";

export default function CartCounter({
  subtotal,
  checkout,
  buttonRef,
}: {
  subtotal: number;
  checkout: Checkout;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="cart-counter">
      <section className="cart-counter-inner" aria-labelledby="cart-counter-heading">
        {/* Cada cifra vive en UN lugar. El subtotal viaja dentro del boton, que
            es la regla que trajimos de la pagina de la obra, asi que una fila
            "Subtotal €205" a 250px de distancia repetiria lo mismo; y cuantas
            copias hay ya lo dice la linea mono arriba del titulo. Lo que queda
            es lo unico que ninguna otra parte de la pantalla dice: el envio.

            Por eso la unica etiqueta VISIBLE dice "Shipping": esta justo encima
            de las dos tarifas y es lo que nombra. Pero el panel tambien tiene el
            boton de pagar y el aviso de sesion, asi que el nombre de la region
            en el arbol de accesibilidad lo pone un encabezado propio, invisible:
            "Shipping" nombraria de menos a lo que este panel es. */}
        <h2 className="sr-only" id="cart-counter-heading">Order summary</h2>
        <p className="cart-counter-legend">Shipping</p>

        {/* Antes el carrito mostraba un total sin envio y Stripe cobraba €5 o
            €10 mas. Las tarifas salen de `SHIPPING_RATES`, que es de donde el
            checkout arma sus `shipping_options`: la pagina no puede anunciar
            una tarifa que Stripe no aplique. Cual de las dos corresponde
            depende de la direccion, que todavia no se pregunto — por eso se
            nombran las dos y se dice donde se decide, en vez de inventar un
            total. */}
        <dl className="cart-shipping">
          {SHIPPING_RATES.map(({ region, label, amount, minDays, maxDays }) => (
            <div key={region}>
              <dt>{label}</dt>
              <dd>
                {formatPrice(amount / 100)}
                <span> · {minDays}–{maxDays} working days</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="cart-shipping-note">Shipping is added at checkout, from your address.</p>

        {checkout.error && (
          <p className="cart-error" role="alert">
            {checkout.error}
          </p>
        )}

        {/* El precio viaja DENTRO del boton, como en la pagina de la obra: la
            decision y su costo en el mismo golpe de vista. */}
        <button
          type="button"
          className="cart-checkout"
          ref={buttonRef}
          onClick={checkout.start}
          disabled={checkout.disabled}
        >
          <span>{checkout.isRedirecting ? "Redirecting…" : "Checkout"}</span>
          <b>{formatPrice(subtotal)}</b>
        </button>

        {checkout.needsSignIn && <p className="cart-signin">You will sign in first.</p>}
      </section>
    </div>
  );
}
