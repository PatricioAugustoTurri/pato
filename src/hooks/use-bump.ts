"use client";

import { useState } from "react";

/**
 * Cuenta las veces que `value` cambió desde que se lo vio por primera vez.
 *
 * Sirve de `key` para una cifra que tiene que acusar recibo de un cambio: el
 * elemento se vuelve a montar con la `key` nueva y su animación de entrada
 * corre otra vez. El primer valor no cuenta, así que nada se anima al cargar
 * la página; solo lo que cambia mientras la persona está mirando.
 *
 * `shouldBump` decide qué cambios merecen el gesto: la insignia del carrito
 * lo hace solo al sumar, porque sacar una obra no es algo que festejar.
 *
 * Usa el patrón de "guardar el valor anterior en el estado" que React
 * documenta para derivar de un cambio de props, en vez de un efecto: así no
 * hay un render de más ni un cuadro con la cifra vieja.
 */
export function useBump<T>(value: T, shouldBump: (previous: T, next: T) => boolean = (a, b) => a !== b): number {
  const [previous, setPrevious] = useState(value);
  const [count, setCount] = useState(0);

  if (!Object.is(previous, value)) {
    setPrevious(value);
    if (shouldBump(previous, value)) setCount(count + 1);
  }

  return count;
}
