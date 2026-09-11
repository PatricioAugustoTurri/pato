---
version: 1
slug: "src-app-shop-slug-page-tsx"
primary_target: "src/app/shop/[slug]/page.tsx"
related_targets: ["src/app/shop/[slug]/components/CategoryRoom.tsx","src/app/shop/[slug]/components/CategoryHero.tsx","src/lib/place.ts"]
---

# Colección (/shop/[slug])

Scope: la página de una colección — su cartel de sala y su colgado. El hero
(`CategoryHero`) queda **fuera de scope por decisión del usuario el 2026-09-10**:
"el hero se ve muy bien, no tenes que modificarlo".

Modo del visitante: **Experience** — llega a mirar obra, no a completar una
tarea. La fotografía lidera; la interfaz se corre.

Audiencia: quien ya eligió una colección en /shop y entra a ver qué hay dentro.
Trabajo de la página: que mire obra, y que la que le hable se abra.

## Direction contract

**THESIS.** La sala continúa. La colección NO vuelve al papel: sigue en tinta,
la misma de /shop y la del footer, así que home → tienda → colección se recorre
como un solo espacio en vez de tres materiales distintos. El hero es la puerta;
esto es la sala. Rechaza la grilla de tarjetas iguales con esquina redondeada y
caja de rótulo que había antes: ponía un marco y una etiqueta blanca alrededor
de cada fotografía, que es exactamente lo que el principio nº1 del producto
prohíbe.

**LA PRUEBA QUE LA OBLIGÓ.** El catálogo es casi mitad y mitad: Portrait tiene
11 horizontales y 10 verticales; las proporciones reales son 2:3, 3:4, 4:3, 3:2
y 16:9. La caja fija 4:5 de la grilla vieja le comía el 47% del cuadro a cada
3:2. `getImageRatio()` ya existía y la página About ya lo usaba. No recortar no
era una aspiración: estaba construido y sin usar.

**OWN-WORLD.** Fondo tinta a sangre. Familjen Grotesk para la voz de autor y
los títulos de obra, DM Mono para números, país y ficha de impresión, DM Sans
para la prosa. Radio cero, filetes de 1px, cero sombras. La profundidad la da
la luz sobre la obra: en reposo cada fotografía está a `brightness(.88)` y al
acercarse sube a 1.04 — la sala se enciende sobre el cuadro que estás mirando.

**EL COLGADO.** Las obras se agrupan de a pares y dentro de un par el ancho de
cada una es su propia proporción: por eso las dos miden lo mismo de alto sin
que a ninguna haya que recortarla. Cada tercera pared cuelga una obra sola, con
el ancho derivado también de su forma (una 2:3 a 78% mediría pantalla y media).
La segunda del par baja un escalón, y las paredes entran alternadamente por un
lado y por el otro. El ritmo no lo inventa la interfaz: sale del cuadro. Es el
mismo argumento que el muro de /shop, donde el ancho del panel es la cantidad
de obras — en los dos casos la forma la decide el catálogo, no la plantilla.

**LA CARTELA.** Debajo del cuadro, nunca encima: una sala no imprime el título
sobre la obra. Número correlativo en mono, título en Familjen Grotesk, país en
mono — y el país **sólo cuando el título no lo nombró ya**. Casi todos los
títulos dicen el lugar en inglés ("...in Vietnam", "A Face of Malaysia") y la
columna `pais` lo guarda en castellano, así que sin cruzarlos la cartela se
repetía a sí misma. El cruce vive en `src/lib/place.ts`.

**EL PRECIO.** Las 41 obras del archivo cobran exactamente lo mismo: A4 €40 ·
A3 €55 · A2 €70, verificado contra `photo_variants`. Entonces el precio no es
un dato de la obra, es una condición de la sala: se declara una vez en el
cartel de entrada y no se repite veintiuna veces debajo de cada fotografía,
donde no distinguiría nada y competiría con la imagen. Sale de la base, no de
una constante en la vista, y si algún día los precios dejan de ser uniformes el
bloque se calla solo en vez de mentir.

**LA JUNTA.** El velo inferior del hero resuelve en `--ink` exacto (misma regla
que `.shop-hero`), así la fotografía se apaga y la sala empieza ahí. Abajo, el
footer ya es tinta: la página entra y sale sin costura.

**FINISH.** Verificado el 2026-09-10 en desktop (1440) y móvil (390), sobre la
colección más grande (Portrait, 21) y la más chica (History, 5). Todo el texto
sobre tinta pasa AA: lo más ajustado es el número de obra en `--footer-muted` a
5,67:1; el resto va de 8,95:1 a 13,91:1.

## Decisiones sin resolver

- **Idioma.** PRODUCT.md registra que el sitio va en inglés y que el castellano
  es un remanente a traducir. Esta sala se escribió en inglés y se tradujeron
  las dos etiquetas de la ficha del hero (`Works` / `Countries`) para que la
  página no quedara partida en dos idiomas. Los **valores** de país siguen en
  castellano porque son dato de la base ("Tailandia", "Marruecos"), y el resto
  del sitio sigue mezclado. Falta una pasada de idioma completa; no se hizo acá
  porque es trabajo de todo el sitio, no de esta superficie.
- **Cuatro títulos de la base arrastran una comilla recta suelta** (Popocatépetl,
  Storm Line, A Face of Malaysia, A Village in Color). Se limpian al mostrar en
  `cleanTitle()`, no en la base. Conviene arreglar el origen.
- La taxonomía colección-vs-destino sigue abierta en PRODUCT.md. Esta página se
  para sobre colección, que es lo que existe en la base, sin cerrar la pregunta.
