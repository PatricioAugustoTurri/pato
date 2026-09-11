"use client";

import type { RefObject } from "react";
import { formatPrice } from "@/lib/money";
import { SHIPPING_RATES, shippingRate, type ShippingRegion } from "@/lib/shipping";
import type { Checkout } from "../use-checkout";

export default function CartCounter({
  subtotal,
  region,
  onRegionChange,
  checkout,
  buttonRef,
}: {
  subtotal: number;
  region: ShippingRegion;
  onRegionChange: (region: ShippingRegion) => void;
  checkout: Checkout;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const shippingAmount = shippingRate(region).amount;

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

        {/* Antes esto eran dos tarifas dibujadas una debajo de la otra y un
            aviso de que el envio se sumaba despues. El problema no era la
            copia: el checkout mandaba LAS DOS tarifas a Stripe, y su pagina
            alojada no sabe filtrarlas por direccion —lo dice su documentacion—,
            asi que las ofrecia como un selector y se podia elegir Italia a 5
            EUR desde Finlandia.

            Eligiendo la zona aca, la sesion se crea con una sola tarifa y solo
            con los paises de esa zona: la combinacion equivocada deja de ser
            posible. De paso el carrito puede decir el total de verdad, que con
            dos tarifas en el aire no podia.

            Se reusa el juego del selector de tamano de la ficha de obra: es la
            misma decision —elegir una opcion en un mostrador— y el sitio ya
            tiene una forma para eso. */}
        <fieldset className="buy-sizes">
          <legend>Ships to</legend>
          {SHIPPING_RATES.map(({ region: value, label, amount, minDays, maxDays }) => (
            <label className="buy-size" key={value} data-selected={region === value ? "" : undefined}>
              <input
                type="radio"
                name="shipping-region"
                value={value}
                checked={region === value}
                onChange={() => onRegionChange(value)}
              />
              <span className="buy-size-name">{label}</span>
              <span className="buy-size-note">
                {minDays}–{maxDays} working days
              </span>
              <span className="buy-size-price">{formatPrice(amount / 100)}</span>
            </label>
          ))}
        </fieldset>

        <p className="cart-shipping-note">
          The address is asked for on the payment page, within the region you choose here.
        </p>

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
          <b>{formatPrice(subtotal + shippingAmount / 100)}</b>
        </button>

        {checkout.needsSignIn && <p className="cart-signin">You will sign in first.</p>}
      </section>
    </div>
  );
}
