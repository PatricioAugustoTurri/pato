"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useCart, { type CartItem } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/money";
import { sizeDimensions } from "@/lib/sizes";
import type { PhotoVariant } from "@/types/PhotoType";

/* Las medidas ISO viven en `@/lib/sizes` porque el carrito dice lo mismo. Este
   panel no dice nada sobre gramaje ni tipo de papel: NO estan confirmados con
   el autor. Y no dice existencias porque no las hay: cada copia se imprime
   cuando alguien la compra, asi que "quedan 3" seria una escasez inventada. */

export default function PurchasePanel({
  photoId,
  photoName,
  imageUrl,
  imageAlt,
  href,
  variants,
}: {
  photoId: number;
  photoName: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  variants: PhotoVariant[];
}) {
  const addItem = useCart((state) => state.addItem);
  const items = useCart((state) => state.items);
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [justAdded, setJustAdded] = useState(false);
  /* En el telefono la obra ocupa la pantalla y el mostrador queda abajo: apenas
     bajas a leer, comprar desaparece y no vuelve. La barra fija aparece cuando
     el boton real sale de vista, y se va cuando vuelve — nunca las dos juntas.
     En escritorio no existe: ahi la decision entera entra en un golpe de vista. */
  const addRef = useRef<HTMLButtonElement>(null);
  const [addOffScreen, setAddOffScreen] = useState(false);

  useEffect(() => {
    const node = addRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setAddOffScreen(!entry.isIntersecting),
      { rootMargin: "0px 0px -72px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* La confirmacion en el boton dura lo justo y despues vuelve, porque desde
     aca se puede seguir agregando otro tamano de la misma obra. */
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2400);
    return () => clearTimeout(timer);
  }, [justAdded]);

  if (variants.length === 0) {
    return (
      <p className="buy-unavailable">
        This work has no sizes available right now. Write to info@patoturri.com and
        we will let you know when it is back.
      </p>
    );
  }

  const selected = variants.find((variant) => variant.id === selectedId);
  /* No hay "agotado" en esta tienda: cada copia se imprime cuando alguien la
     compra, así que ningún número puede impedir una venta. Lo único que deja
     el botón sin trabajo es que no haya un tamaño elegido, que con la lista ya
     dibujada solo pasa si la obra no tiene ninguno —y de eso se ocupa el
     `variants.length === 0` de arriba. */
  const noSize = !selected;
  /* Cuantas copias de ESTA obra ya hay en el carrito, en cualquier tamano. */
  const inCart = items
    .filter((item) => item.photoId === photoId)
    .reduce((sum, item) => sum + item.quantity, 0);

  const handleAdd = () => {
    if (!selected) return;

    const cartItem: CartItem = {
      photoId,
      name: photoName,
      imageUrl,
      alt: imageAlt,
      href,
      size: selected.size,
      price: Number(selected.price),
      attributes: { size: selected.size, price: Number(selected.price) },
      quantity: 1,
    };

    addItem(cartItem);
    setJustAdded(true);
  };

  return (
    <div className="buy">
      <fieldset className="buy-sizes">
        <legend>Choose a size</legend>

        {variants.map((variant) => {
          return (
            <label
              className="buy-size"
              key={variant.id}
              data-selected={selectedId === variant.id ? "" : undefined}
            >
              <input
                type="radio"
                name="photo-size"
                value={variant.id}
                checked={selectedId === variant.id}
                onChange={() => {
                  setSelectedId(variant.id);
                  setJustAdded(false);
                }}
              />
              <span className="buy-size-name">{variant.size}</span>
              <span className="buy-size-note">{sizeDimensions(variant.size)}</span>
              <span className="buy-size-price">{formatPrice(variant.price)}</span>
            </label>
          );
        })}
      </fieldset>

      <button
        type="button"
        className="buy-add"
        ref={addRef}
        onClick={handleAdd}
        disabled={noSize}
        /* El precio viaja DENTRO del boton: la decision y su costo se leen en
           el mismo golpe de vista, sin una cifra suelta repitiendo lo que la
           fila elegida ya dice. */
      >
        <span>{justAdded ? "Added to cart" : "Add to cart"}</span>
        {selected && <b>{formatPrice(selected.price)}</b>}
      </button>

      {inCart > 0 && (
        <p className="buy-incart">
          {inCart === 1 ? "1 print of this work" : `${inCart} prints of this work`} in your
          cart. <Link href="/cart">View cart ↗</Link>
        </p>
      )}

      {/* Los unicos hechos de envio que estan confirmados. Nada de plazos de
          impresion ni de papeles mientras no exista el mecanismo detras. */}
      <dl className="buy-terms">
        <div>
          <dt>Shipping in Italy</dt>
          <dd>€5 · 2–5 working days</dd>
        </div>
        <div>
          <dt>Rest of the EU</dt>
          <dd>€10 · 4–10 working days</dd>
        </div>
      </dl>

      {/* Fuera del flujo del mostrador y al alcance del pulgar. Repite lo justo:
          que tamano esta elegido, cuanto sale y el boton. */}
      <div className="buy-bar" data-visible={addOffScreen ? "" : undefined} aria-hidden={!addOffScreen}>
        <span className="buy-bar-what">
          <b>{selected?.size}</b>
          <span>{selected ? formatPrice(selected.price) : ""}</span>
        </span>
        <button type="button" onClick={handleAdd} disabled={noSize} tabIndex={addOffScreen ? 0 : -1}>
          {justAdded ? "Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
