---
version: 1
slug: "src-app-shop-slug-photoslug-page-tsx"
primary_target: "src/app/shop/[slug]/[photoSlug]/page.tsx"
related_targets: ["src/app/shop/[slug]/[photoSlug]/components/PhotoPlate.tsx","src/app/shop/[slug]/[photoSlug]/components/PurchasePanel.tsx","src/app/shop/[slug]/[photoSlug]/components/WorkNote.tsx","src/lib/money.ts"]
---

# La obra (/shop/[slug]/[photoSlug])

Scope: la página donde se mira una fotografía y se compra la copia.

Modo del visitante: **Operate con apertura Experience**. Llega a mirar, pero su
éxito es elegir un tamaño y agregarlo al carrito. La obra lidera el primer
golpe de vista; el mostrador tiene que estar ahí mismo, no debajo.

## Lo que estaba roto (2026-09-10)

Medido, no supuesto:

1. **La copia se veía más chica que su propio título.** 360 × 540 px en una
   pantalla de 1440, dentro de una caja de alto fijo con paspartú, en la única
   página cuyo trabajo es vender una copia de €40 a €70.
2. **Comprar quedaba fuera del primer viewport.** El selector de tamaño y el
   botón vivían debajo de 1.400 caracteres de descripción (el catálogo tiene
   entre 501 y 1.445 por obra, promedio 1.096).
3. **La obra viajaba como `background-image`**, sin optimizar ni tamaños
   responsive: la única imagen de la página, cruda.
4. **Callejón sin salida**: se miraba, se agregaba al carrito y la única forma
   de seguir era el botón de atrás.
5. El precio aparecía dos veces, en formato `40.00 EUR`, y la página era crema
   —rompía la continuidad de tinta que traen /shop y la colección.

## Direction contract

**THESIS.** Dos materiales, dos trabajos. La obra cuelga en el mismo campo de
tinta del que venís, entera y lo más grande que entre; al lado, sobre papel, el
mostrador donde se elige tamaño y se compra. El papel no es contraste decorativo:
es literalmente lo que se está comprando.

**EL CAMPO.** Toma lo que queda de pantalla bajo la barra. La obra se contiene,
nunca se recorta: es la pantalla donde alguien decide gastar €70 y ver media
obra no es una opción. Resultado medido: 464 × 696 px para una 2:3 vertical —
un 66% más de área que antes— y 840 × 630 para una horizontal. `next/image` con
`quality={90}`, no un background CSS.

**EL MOSTRADOR.** Columna de papel a toda la altura del campo. Rastro, título,
país, tres ediciones y el botón. Sin `sticky`: el campo mide exactamente un
viewport, así que no hay nada por lo que el panel pueda quedarse quieto.

**LAS EDICIONES.** Tres filas separadas por filete, no tres tarjetas — una caja
alrededor de cada opción sería el mismo marco que le sacamos a las fotografías.
La elegida se rellena de tinta, así el estado se lee de reojo sin buscar el
punto del radio. El radio nativo queda oculto pero sigue siendo el control: el
teclado y el lector de pantalla ven un `fieldset` de radios de verdad, y el
anillo de foco se dibuja sobre la fila.

**EL PRECIO VIAJA EN EL BOTÓN.** La decisión y su costo en un mismo golpe de
vista, en vez de una cifra suelta repitiendo lo que la fila elegida ya dice.

**LO QUE LA PÁGINA NO DICE.** No hay papel ni gramaje: PRODUCT.md los marca
como NO confirmados con el autor. No hay escasez: la base guarda stock (3 a 15)
pero ninguna compra lo descuenta, así que "quedan 3" sería inventado. Sí hay
envío, que está confirmado: €5 en Italia (2–5 días), €10 al resto de la UE
(4–10 días).

**LA SALIDA.** Tres obras vecinas de la misma colección al pie, más el enlace a
la colección entera.

**FINISH.** Verificado el 2026-09-10 en desktop (1440) y móvil (390), con obra
vertical (2:3) y horizontal (4:3), y ejercitando los estados: elegida, foco por
teclado, agotada, agregada al carrito, "n copias en tu carrito", y la lupa.
Todo el texto pasa AA: lo más ajustado es `--text-muted` sobre crema a 4,67:1 y
el hover del botón a 4,66:1; el resto va de 5,08:1 a 13,91:1.

## El teléfono (2026-09-10)

**El escritorio está aprobado y congelado por decisión del usuario**: "en formato
escritorio me gusta un montón, no lo cambies". Todo lo de abajo vive dentro de
`@media (max-width: 900px)` o en piezas que arrancan en `display: none`. Se
verificó con un diff píxel a píxel contra la captura aprobada: **0 subpíxeles de
diferencia** a 1440 × 900.

Apilar la pantalla de escritorio no alcanzaba, y estos eran los tres defectos:

1. **La obra caía a 274 × 411 px sobre una pantalla de 844** — menos de media
   pantalla, en la página que vende esa copia. Ahora el campo toma
   `100svh − barra − mostrador` y la obra abre en 356 × 534: **un 69% más de
   área**.
2. **Comprar desaparecía.** En escritorio la decisión entera entra en un golpe
   de vista; apilado, apenas bajabas a leer, el botón se iba y no volvía. Se
   agregó una **barra fija al alcance del pulgar** con el tamaño elegido, el
   precio y el botón. Un `IntersectionObserver` sobre el botón real la muestra
   sólo cuando ese botón no está a la vista: nunca se ven los dos juntos.
   Verificado: visible arriba de todo, oculta con el botón real en pantalla,
   visible otra vez al bajar a leer.
3. **La nota de autor era un muro de treinta líneas** (900 px de columna). En
   angosto se recorta a siete líneas y se abre al tocar; el párrafo entero sigue
   siempre en el DOM. La página pasó de **3.254 a 2.775 px**.

**El orden en angosto** (pedido del usuario): obra → rastro → título → país →
**descripción** → tamaños → comprar. Se lee de qué es la obra antes de elegir en
qué tamaño se compra. Ese reordenamiento cruza dos contenedores —la nota vive
fuera de `.work-view`, los tamaños dentro del mostrador—, así que `order` solo no
alcanzaba: `display: contents` disuelve las dos cajas intermedias y promueve a
todos sus hijos a una única grilla en `.work-page`, donde recién ahí son hermanos
y se pueden ordenar. Dos consecuencias que hubo que atender: el mostrador perdió
su caja, así que **su fondo crema y su relleno se repartieron entre los cinco
bloques** que ahora corren sueltos; y como ítems de grilla los márgenes ya no se
colapsan y quedaban FUERA del fondo, abriendo franjas de papel que cortaban el
panel — **todo el espaciado de esa corrida va en relleno, nunca en margen**. El
`<aside>` del mostrador pasó a `<div>`: promoverlo con `display: contents` le
habría quitado su rol `complementary` sólo en móvil, y además el panel de compra
no es contenido complementario, es el punto de la página.

Además: las filas de tamaño pasaron de 51 a 62 px de alto, y las tres obras
vecinas van en un carril que se desliza con `scroll-snap` en vez de esconder la
tercera, que además se seguía descargando.

**La lupa** pasó por dos versiones. La primera la convertía en una pastilla
centrada con borde, porque en táctil no hay hover que la descubra; el usuario la
quiso del tamaño de escritorio (2026-09-11). La versión final **se ve exactamente
igual que en escritorio** —misma etiqueta de 9 px en mono, mismo ícono, misma
esquina— y lo único que cambia es el área tocable: 101 × 44 px, medida en el
navegador. Como el fondo es transparente, ese área no se ve. Es la regla general
para los controles de esta página en táctil: **agrandar el área, no el dibujo**.

Contraste de lo nuevo: tamaño elegido 13,91:1 · precio 9,60:1 · botón 13,91:1 ·
botón agotado 5,06:1 · borde de la lupa 5,67:1.

## Decisiones sin resolver

- **`\.buy-add:disabled` en ESCRITORIO mide 1,70:1** (`--paper` sobre
  `--line-soft`). Es el estado de una obra agotada y hoy no se ve nunca —las 123
  variantes tienen stock entre 3 y 15— pero cuando aparezca va a ser ilegible.
  **No se tocó porque es una regla de escritorio y el escritorio está congelado.**
  Se arregla con una palabra; hay que pedirlo.

- **Formato de dinero.** Se creó `src/lib/money.ts` con `formatPrice()` y esta
  página y la colección ya lo usan (`€40`). **El carrito, el checkout y el panel
  de admin siguen formateando a mano con `toFixed(2)` y "EUR"** — conviene
  pasarlos por ahí en una sola barrida.
- **Idioma.** Esta página se escribió entera en inglés, que es la decisión
  registrada en PRODUCT.md. El carrito y el checkout siguen en castellano, y el
  toast del carrito (`use-cart.tsx`, compartido) dice "Agregado al carrito".
  Falta la pasada completa.
- El `<ViewTransition name={photo-<id>}>` tiene que seguir coincidiendo con el
  de `CategoryRoom`: es lo que hace que la miniatura de la sala crezca hasta su
  sitio acá en vez de desaparecer y reaparecer. Si se renombra uno, se rompe.
