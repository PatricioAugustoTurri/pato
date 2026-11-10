"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useCart, { type CartItem } from "@/hooks/use-cart";
import { track } from "@/lib/analytics";
import { useBump } from "@/hooks/use-bump";
import { formatPrice } from "@/lib/money";
import { sizeDimensions } from "@/lib/sizes";
import type { PhotoVariant } from "@/types/PhotoType";
import {
  DIGITAL_LICENSE,
  DIGITAL_PRICE,
  DIGITAL_SIZE,
  isDigital,
  printSizeAt300,
} from "@/lib/digital";

/* El archivo digital entra en la lista como una fila más, con un id que
   ninguna variante de la base puede tener. */
const DIGITAL_ID = -1;

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
  variants: printVariants,
  digital,
}: {
  photoId: number;
  photoName: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  variants: PhotoVariant[];
  /** Las medidas del original, o null si la obra no se vende en digital. */
  digital: { width: number; height: number } | null;
}) {
  const variants: PhotoVariant[] = digital
    ? [...printVariants, { id: DIGITAL_ID, size: DIGITAL_SIZE, price: DIGITAL_PRICE }]
    : printVariants;
  const addItem = useCart((state) => state.addItem);
  const items = useCart((state) => state.items);
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [justAdded, setJustAdded] = useState(false);
  /* El precio rota en el boton cada vez que se elige otro tamaño. */
  const priceBump = useBump(selectedId);
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
  const digitalSelected = isDigital(selected?.size);
  /* Cuantas copias impresas de ESTA obra ya hay en el carrito, en cualquier
     tamano, y si el archivo ya esta: el archivo se compra una sola vez. */
  const inCart = items
    .filter((item) => item.photoId === photoId && !isDigital(item.size))
    .reduce((sum, item) => sum + item.quantity, 0);
  const fileInCart = items.some((item) => item.photoId === photoId && isDigital(item.size));
  const blocked = noSize || (digitalSelected && fileInCart);
  const addLabel = digitalSelected && fileInCart ? "In your cart" : justAdded ? "Added to cart" : "Add to cart";

  const handleAdd = () => {
    if (!selected || blocked) return;

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
    track("add_to_cart", { work: photoName, size: selected.size });
    setJustAdded(true);
  };

  return (
    <div className="buy">
      <fieldset className="buy-sizes">
        <legend>Choose a size</legend>

        {variants.map((variant) => {
          return (
            <Fragment key={variant.id}>
              {/* El archivo va aparte de los tamaños de papel: es otra cosa, y es
                  la forma barata de ayudar al viaje. */}
              {variant.id === DIGITAL_ID && (
                <span className="buy-or">Or the file — a contribution to the ride</span>
              )}
              <label
                className="buy-size"
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
            </Fragment>
          );
        })}
      </fieldset>

      <button
        type="button"
        className="buy-add"
        ref={addRef}
        onClick={handleAdd}
        disabled={blocked}
        /* El precio viaja DENTRO del boton: la decision y su costo se leen en
           el mismo golpe de vista, sin una cifra suelta repitiendo lo que la
           fila elegida ya dice. */
      >
        <span>{addLabel}</span>
        {/* Al cambiar de tamaño el precio rota en su lugar: cambiar la cifra
            de golpe dentro de un boton que no se movio es facil de no ver. */}
        {selected && (
          <b className="figure-roll" key={priceBump} data-bump={priceBump > 0 || undefined}>
            {formatPrice(selected.price)}
          </b>
        )}
      </button>

      {(inCart > 0 || fileInCart) && (
        <p className="buy-incart">
          {[
            inCart === 1 ? "1 print" : inCart > 1 ? `${inCart} prints` : null,
            fileInCart ? "the digital file" : null,
          ]
            .filter(Boolean)
            .join(" and ")}{" "}
          of this work in your cart. <Link href="/cart">View cart ↗</Link>
        </p>
      )}

      {/* Con el archivo elegido, el envio no dice nada: lo que importa es que
          llega en el acto, hasta donde se imprime bien y para que se puede usar. */}
      {digitalSelected && digital ? (
        <>
          <dl className="buy-terms">
            <div>
              <dt>Delivery</dt>
              <dd>Instant download after payment</dd>
            </div>
            <div>
              <dt>Prints sharp up to</dt>
              <dd>{printSizeAt300(digital.width, digital.height)} at 300 dpi</dd>
            </div>
          </dl>
          <p className="buy-license">{DIGITAL_LICENSE}</p>
        </>
      ) : (
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
      )}

      {/* Fuera del flujo del mostrador y al alcance del pulgar. Repite lo justo:
          que tamano esta elegido, cuanto sale y el boton. */}
      <div className="buy-bar" data-visible={addOffScreen ? "" : undefined} aria-hidden={!addOffScreen}>
        <span className="buy-bar-what">
          <b>{selected?.size}</b>
          <span>{selected ? formatPrice(selected.price) : ""}</span>
        </span>
        <button type="button" onClick={handleAdd} disabled={blocked} tabIndex={addOffScreen ? 0 : -1}>
          {digitalSelected && fileInCart ? "In your cart" : justAdded ? "Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
