---
version: 1
slug: "src-app-cart-page-tsx"
primary_target: "src/app/cart/page.tsx"
related_targets: ["src/app/cart/components/CartLine.tsx","src/app/cart/components/CartCounter.tsx","src/hooks/use-cart.tsx","src/app/checkout/success/page.tsx"]
---

# El carrito (/cart)

Scope: la pantalla donde se revisa la selección antes de pagar, más las dos
pantallas de vuelta de Stripe (/checkout/success, /checkout/cancel), que
comparten su shell.

Modo del visitante: **Operate**. No viene a mirar, viene a confirmar qué eligió
y a pagar. La fotografía sigue estando porque es lo que se reconoce de un
vistazo, no como decoración.

## Lo que estaba roto (2026-09-11)

Medido, no supuesto:

1. **Era la última pantalla del idioma viejo, en los dos sentidos.** Crema plano
   con cajitas de papel flotando, miniatura cuadrada de 145px servida como
   `background-image`, `40.00 EUR` a mano, cero hover y cero foco. Exactamente
   la grilla de tarjetas que el contrato de /shop rechaza por escrito.
2. **El total mentía.** No mencionaba el envío, así que Stripe cobraba €5 o €10
   más de lo que el carrito acababa de mostrar.
3. **La cantidad solo podía subir.** Bajar de 3 copias a 1 obligaba a borrar la
   línea y volver a la obra tres veces.
4. **Parpadeaba vacío** en la primera pintura: zustand `persist` lee
   localStorage después del primer render y no había guarda.
5. **Callejón sin salida**: desde una línea no se podía volver a la obra.

## Direction contract

**THESIS.** Dos materiales, dos trabajos — los mismos de la página de la obra,
una escala más arriba. Las copias elegidas cuelgan sobre tinta, enteras y en su
proporción real; al lado, sobre papel, la cuenta. Rechaza la lista de tarjetas
con resumen flotante, que es el arreglo por defecto de todo carrito.

**OWN-WORLD.** `--ink` a sangre bajo la barra; columna `--cream-100` a la
derecha. Filetes de 1px (`--footer-line` sobre tinta, `--line` sobre papel), sin
cajas y sin sombras: la profundidad la da la luz sobre la obra. Familjen
Grotesk para los títulos de obra, DM Mono para tamaños, cantidades y cifras
(tabular), DM Sans para la prosa. `--accent` solo como señal sobre tinta;
`--accent-text` sobre papel. Radio cero.

**STORY.** El visitante reconoce sus copias, corrige tamaño y cantidad, entiende
que el envío se suma en el checkout, y paga.

**FIRST VIEWPORT.** Arriba a la izquierda, sobre tinta, la cuenta real en mono
—`4 PRINTS · 2 WORKS`— y debajo `Cart` en Familjen Grotesk. Después las líneas
separadas por filete, cada una con la fotografía a `clamp(96px,11vw,132px)` en
su proporción real, el título enlazado a la obra, las medidas ISO en mono, el
stepper bajo las medidas y el precio de línea a la derecha. A la derecha de la
página, a toda la altura y pegajoso, el mostrador de papel: las dos tarifas de
envío leídas de `SHIPPING_RATES`, dónde se calculan, y la barra de tinta
`Checkout · €205` con el precio adentro del botón. El botón está en el primer
viewport, siempre.

*Enmiendas después de la revisión de cierre (2026-09-11), con su razón:*

- **El stepper va bajo las medidas, no a la derecha.** El contrato original lo
  mandaba a la derecha junto al precio. Se cambió: el control va pegado al valor
  que cambia —la cantidad— y a la derecha habría quedado apretado entre el
  precio de línea y `Remove`, que es la acción destructiva. La columna derecha
  queda para leer (precio arriba, `Remove` anclado abajo), la izquierda para
  tocar.
- **El mostrador no repite ninguna cifra.** El contrato original le pedía
  `prints` y `subtotal`. Los dos estaban dichos ya en el mismo golpe de vista
  —las copias en la línea mono del título, el subtotal dentro del botón, que es
  justamente la regla que trajimos de la página de la obra—, así que el
  mostrador se quedó solo con lo que nada más dice: el envío.
- **La línea mono se condiciona.** Con una sola copia, `1 PRINT · 1 WORK` es el
  rótulo decorativo que el craft floor prohíbe, no un dato: por debajo de dos
  copias la línea no se dibuja, y las obras solo se nombran cuando son menos que
  las copias.

**FORM.** Extensión de un mundo establecido (new-work.md §3, "Extend an existing
surface"): hereda la gramática de mostrador del contrato de
`src-app-shop-slug-photoslug-page-tsx` —filas con filete en vez de tarjetas,
precio dentro del botón, `.buy-terms` para los hechos de envío, barra del pulgar
en táctil. Sin torneo de conceptos y sin `concept-seed`: el pedido era preciso y
el mundo ya estaba resuelto y medido. Build code-led, sin comp. Seed key: n/a
(extensión, no tirada de dirección).

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Reglas propias de esta pantalla

- **El mostrador es pegajoso, el de la obra no.** En la página de la obra el
  campo mide exactamente un viewport y no hay por qué quedarse quieto. Acá la
  lista puede ser larga y la cuenta no puede irse de la pantalla.
- **La obra no se recorta.** `object-fit: contain` en caja de alto fijo: la
  proporción es parte de lo que se está comprando, y una copia vertical y una
  horizontal tienen que leerse distintas en la misma lista.
- **El botón lleva el subtotal, no el total.** El envío depende de la dirección,
  que Stripe todavía no preguntó. Decir un total sería inventarlo; callar el
  envío sería mentir. La línea de arriba nombra las dos tarifas y dice dónde se
  calcula.
- **La ranura de eyebrow lleva dato, no etiqueta.** `3 PRINTS · 2 WORKS` ocupa
  el lugar que el mundo del sitio reserva para la línea mono, pero dice algo.
- **El `−` no borra.** Se deshabilita en 1 y `Remove` vive aparte, lejos del
  `+`, para que la acción destructiva no esté pegada a la de sumar.
- **Cambiar cantidad no tira toast.** Se anuncia por una live region; un toast
  por click sería ruido sobre una acción que se repite.

## Decisiones sin resolver

- **`SHIPPING_RATES.name` viaja a Stripe** como `display_name`. Al pasarlo a
  inglés, la página de pago de Stripe también cambió de idioma. Es lo correcto
  con el sitio en inglés, pero es un cambio visible fuera del repo.
- **El parpadeo de hidratación sigue en `NavBar.tsx`** (el badge de la bolsa
  tiene el mismo problema que tenía el carrito). No se tocó.
- **`quality={92}` en `PhotoPlate.tsx:114` y `quality={80}` en
  `StoryReader.tsx:93` no están en `images.qualities`** de `next.config.ts`
  (`[75, 85, 90]`). Next 16 solo sirve las declaradas. Preexistente, no tocado.
- `formatPrice()` ya se usa en el carrito y el checkout; **falta el panel de
  admin**, que sigue con `toFixed(2)` y "EUR".
