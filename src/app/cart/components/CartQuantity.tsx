"use client";

import { Minus, Plus } from "lucide-react";

/* El `−` NO borra. Se deshabilita en 1 y `Remove` vive aparte, del otro lado de
   la linea: una accion destructiva pegada a la de restar se dispara sola. */
export default function CartQuantity({
  quantity,
  title,
  size,
  onChange,
}: {
  quantity: number;
  title: string;
  size: string;
  onChange: (quantity: number) => void;
}) {
  /* El tamano va en la etiqueta: una obra puede estar dos veces en la lista, en
     A4 y en A3, y sin el las dos filas exponen botones con el mismo nombre. Y
     "Decrease quantity" en vez de "Remove one copy", que chocaba con el control
     `Remove` de verdad que vive en la misma fila. */
  const what = `${title}, size ${size}`;

  return (
    <div className="cart-qty">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label={`Decrease quantity, ${what}`}
      >
        <Minus size={13} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {/* No es un input: el teclado numerico invita a escribir un 40 en una
          tienda que no descuenta stock. Dos botones dicen exactamente lo que
          se puede hacer. El valor se anuncia por la live region de la lista. */}
      <span className="cart-qty-value">{quantity}</span>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label={`Increase quantity, ${what}`}
      >
        <Plus size={13} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
