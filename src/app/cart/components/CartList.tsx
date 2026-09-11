"use client";

import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/money";
import CartLine from "./CartLine";

export default function CartList({
  items,
  onRemove,
  onQuantity,
}: {
  items: CartItem[];
  onRemove: (photoId: number, size: string) => void;
  onQuantity: (photoId: number, size: string, quantity: number) => void;
}) {
  /* El stepper no tira toast —seria un aviso por click sobre una accion que se
     repite—, asi que sin esto un lector de pantalla no se entera de nada: el
     numero cambia en silencio y el total tambien. Se anuncia la linea entera,
     que es lo que el visitante acaba de cambiar. */
  const [announcement, setAnnouncement] = useState("");
  const previous = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    const current = new Map(items.map((item) => [`${item.photoId}-${item.size}`, item.quantity]));

    /* La primera pasada solo toma la foto: anunciar el carrito entero apenas
       carga la pagina no es un cambio, es ruido. */
    if (previous.current) {
      for (const item of items) {
        const key = `${item.photoId}-${item.size}`;
        const before = previous.current.get(key);
        if (before !== undefined && before !== item.quantity) {
          const price = Number(item.attributes?.price ?? item.price) * item.quantity;
          setAnnouncement(
            `${item.name}, size ${item.size}: ${item.quantity} ${
              item.quantity === 1 ? "copy" : "copies"
            }, ${formatPrice(price)}.`,
          );
          break;
        }
      }
    }

    previous.current = current;
  }, [items]);

  return (
    <div className="cart-lines">
      {items.map((item) => (
        <CartLine
          key={`${item.photoId}-${item.size}`}
          item={item}
          onRemove={onRemove}
          onQuantity={onQuantity}
        />
      ))}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
