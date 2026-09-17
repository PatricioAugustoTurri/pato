---
version: 1
slug: "src-app-destinations-country-page-tsx"
primary_target: "src/app/destinations/[country]/page.tsx"
related_targets: ["src/components/DestinationsSection.tsx","src/lib/countries.ts"]
---

# País del archivo (/destinations/[country])

Scope: la página de un país, `src/app/destinations/[country]/page.tsx`, y el
enlace que la abre desde `/destinations`.
Modo del visitante: **Experience** — entra a mirar la obra de un lugar, no a
completar una tarea. La fotografía lidera.

Audiencia: el que llegó a /destinations y reconoció un lugar —porque estuvo,
porque quiere ir, o porque le gustó una foto del índice— y quiere ver todo lo
que salió de ahí. Trabajo de la página: mostrar el archivo completo de ese país
y dejarlo entrar a cualquier obra. Prueba disponible: 41 obras repartidas en 12
países, de 1 a 21 por país, con su colección y su forma real; relato de autor en
Vietnam y Tailandia hoy, los otros diez los escribe el autor (respuesta del
2026-09-14).

## Direction contract

**THESIS.** El país es el segundo eje del mismo archivo, no un catálogo aparte.
La página es la sala de colección leída por lugar: misma tinta, mismo colgado,
mismas cartelas. Rechaza la grilla de miniaturas cuadradas que es el arreglo por
defecto de "todas las fotos de X", y rechaza inventarle una identidad propia a
una superficie que es la hermana de `/shop/[slug]`.

**OWN-WORLD.** El heredado, sin una decisión visual nueva: fondo `--ink` a
sangre, portada fotográfica a pantalla completa, colgado en pares con la quinta
obra sola y el ancho de cada cuadro sacado de su propia proporción, cartela
debajo del cuadro en mono, filetes de 1px, radio cero.

**STORY.** El visitante entiende que detrás del nombre de un país hay cuerpo
real —lo ve en la cifra y en el muro—, reconoce que sigue en el mismo archivo y
no en otro sitio, y entra a una obra.

**FIRST VIEWPORT.** Una obra del país a sangre ocupa la pantalla: la destacada,
o la primera del archivo si no hay ninguna marcada. Encima, el nombre del país
en inglés en Familjen Grotesk; contra el borde inferior, la ficha en DM Mono con
las cifras verificables: `Works N` y `Collections` con los nombres de las
colecciones que ese país atraviesa. Es la inversión exacta de la portada de
colección, que nombra los países: la misma ficha, el otro eje. Al hacer scroll,
el relato del autor si ese país lo tiene, y después el muro con TODAS las obras
del país en el orden del autor.

**FORM.** La sala de colección, heredada. Sin torneo de conceptos y sin seed:
es una extensión de una superficie establecida y un pedido preciso, los dos
casos en que el playbook prohíbe tirar los dados. La única invención es de
contenido, no de forma: en la cartela de cada obra, el lugar —que acá sería el
mismo doce veces— cede su renglón al nombre de la colección.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisiones sin resolver

- La taxonomía colección-vs-destino sigue abierta en PRODUCT.md. Esta página NO
  la cierra: agrega el eje de lugar al lado del de colección, y la obra se sigue
  comprando en su URL de colección (`/shop/[slug]/[photoSlug]`), que es la
  canónica. Ninguna obra gana una segunda dirección.
- Diez de los doce países no tienen relato. El autor dijo que los escribe; hasta
  que lleguen, esas diez páginas abren la portada y van derecho al muro, sin
  bloque de texto vacío. Los huecos están listos en `countries.ts`.
- **La ficha del hero no es navegación, y es una decisión.** La revisión de
  cierre marcó que `Countries` en una colección y `Collections` en un país son
  hoy nombres muertos, ahora que cada uno de esos nombres tiene dirección. Se
  deja así: esa ficha es lo que se cuenta de la sala —la cifra verificable, en
  mono, sobre la fotografía—, no su barra de navegación. Meter doce enlaces
  sobre la tapa haría competir el primer viewport con la obra, que es la
  primera regla del producto. La puerta a un país es su nombre en
  /destinations; la puerta a una colección es /shop.
- **La sala no tiene puerta de vuelta, y es una decisión tomada.** La revisión
  de cierre marcó que estas doce páginas cuelgan de un índice que la barra de
  navegación no nombra —ahí está /shop, no /destinations; el pie sí lo nombra—.
  Se agregó un enlace de cierre al pie de la sala y **el autor lo retiró el
  2026-09-14 porque no le gustaba**. El hallazgo queda abierto a propósito: la
  salida que queda es el pie del sitio y el botón de atrás. La otra forma de
  cerrarlo es una entrada «Destinations» en la barra, que es una decisión del
  autor sobre todo el sitio y no de esta superficie.
- La portada del país es su obra destacada, que además cuelga en el muro. Si
  alguna vez molesta verla dos veces, el lugar a mirar es si el país merece una
  tapa propia en la base, como la tienen las colecciones.
