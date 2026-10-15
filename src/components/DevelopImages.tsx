"use client";

import { useEffect } from "react";

/* Las fotografías del catálogo que se revelan al llegar. La portada ya entra
   así —un fogonazo que baja hasta el color, como una copia en la cubeta—, y
   esto lleva el mismo gesto a cada obra que se carga después: las salas de
   colección y las obras relacionadas de cada ficha.

   La animación vive en el CSS (`[data-developed]`); acá solo se marca la
   imagen en el instante en que termina de bajar. Un solo oyente para todo el
   documento, en fase de captura porque `load` no burbujea, en vez de un
   `onLoad` por cada <Image>: así no hay que convertir en componentes de
   cliente las salas, que se dibujan en el servidor.

   Lo que ya había cargado antes de que esto corra no se marca y se queda
   quieto, que es lo correcto: ya estaba a la vista. Y si este script no corre,
   las imágenes aparecen normales: el estado por defecto es visible. */
const SELECTOR = ".hang-image, .work-more-frame img";

export default function DevelopImages() {
  useEffect(() => {
    const onLoad = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.matches(SELECTOR)) {
        target.dataset.developed = "";
      }
    };

    document.addEventListener("load", onLoad, true);
    return () => document.removeEventListener("load", onLoad, true);
  }, []);

  return null;
}
