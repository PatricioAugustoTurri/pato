"use client";

import { getImageProps } from "next/image";

/* La tapa de la portada es el retrato del autor, no una obra del catálogo. Por
   eso es un archivo del repositorio y no sale de `photos`: ninguna bandera del
   panel la elige, y el índice de abajo no anuncia "En portada" porque lo que se
   ve no es una obra que se pueda comprar.

   Componente de cliente porque el loader de imagenes lo es: `getImageProps`
   lo llama, y desde el servidor no se puede. */
const COVER = "/Pato/_MG_7748.jpg";
/* Un solo `alt` para las dos tomas, porque el <source> cambia la imagen y no el
   texto: describe lo que tienen en comun. Decir la figura seria falso en todo
   telefono. */
const COVER_ALT = "A lake and a line of trees below a snow-capped mountain";

/* En telefono y tablet la tapa es la misma toma sin la figura: el lago, los
   arboles y la montana solos, con la entrada y el grano de siempre. Ahi la
   figura quedaba en el centro de una caja angosta, el revelado la hacia saltar
   antes que el paisaje y el titular le caia a los pies; el autor pidio sacarla
   (2026-10-22). La placa se relleno con LaMa sobre la silueta de
   `_MG_7748-quieto.png`. Toda pantalla vertical y todo dedo, en cualquier
   orientacion: la regla es el aparato, no el ancho. */
const BACKGROUND = "/Pato/_MG_7748-fondo.jpg";
const WITHOUT_FIGURE = "(orientation: portrait), (pointer: coarse)";

export default function HeroCover() {
  const common = { alt: COVER_ALT, fill: true, sizes: "100vw", quality: 90 };
  const {
    props: { srcSet: background },
  } = getImageProps({ ...common, src: BACKGROUND });
  // Sin `preload`: el <link> de precarga no sabe del <source> y bajaria la tapa
  // con figura tambien en el telefono que no la muestra.
  const { props: cover } = getImageProps({
    ...common,
    src: COVER,
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <picture>
      <source media={WITHOUT_FIGURE} srcSet={background} sizes={common.sizes} />
      <img {...cover} alt={cover.alt} />
    </picture>
  );
}
