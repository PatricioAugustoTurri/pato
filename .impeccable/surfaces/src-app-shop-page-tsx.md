---
version: 1
slug: "src-app-shop-page-tsx"
primary_target: "src/app/shop/page.tsx"
related_targets: ["src/app/shop/components/ShopRoom.tsx","src/app/shop/components/ShopHero.tsx"]
---

---
version: 1
slug: "src-app-shop-page-tsx"
primary_target: "src/app/shop/page.tsx"
related_targets: ["src/app/shop/components/ShopHeader.tsx","src/app/shop/components/ShopCategoryGrid.tsx"]
---

# Shop index (/shop)

Scope: la portada de la tienda, `src/app/shop/page.tsx` y sus componentes.
Modo del visitante: **Experience** — el visitante entra a mirar obra, no a
completar una tarea. La fotografía lidera; la interfaz se corre.

Audiencia: comprador frío de fine-art print y seguidor de Pato, ambos llegando
sin saber qué colección quieren. Trabajo de la página: hacer que elija una
colección y entre. Prueba disponible: 41 fotografías reales, 12 países, cuatro
textos de autor de ~1.100 caracteres ya escritos. Restricción: los precios y
tamaños son uniformes (A4 €40 · A3 €55 · A2 €70), así que el precio no
diferencia colecciones y no es material de jerarquía acá.

## Direction contract

**THESIS.** La tienda es la única sala oscura del sitio. Rechaza la grilla de
cuatro tarjetas iguales —eyebrow, título, párrafo, borde— que es el arreglo por
defecto de la categoría y lo que el usuario nombró como "impostada, tipo
WordPress". Cuatro tarjetas idénticas mienten sobre el catálogo: dicen que las
cuatro colecciones pesan lo mismo, cuando una tiene 5 obras y otra 21.

**OWN-WORLD.** Fondo tinta `--ink` a sangre, que en el resto del sitio sólo usa
el footer. Texto en papel y crema sobre ese fondo; terracota `--accent` sólo
como señal de estado. Familjen Grotesk para los nombres de colección, DM Mono
para cifras y metadatos, DM Sans para la prosa. Radio cero, filetes de 1px,
cero sombras: la profundidad la da la luz sobre la obra, no una caja elevada.

**STORY.** El visitante entiende que está frente a un archivo de autor, no un
catálogo; cree que hay cuerpo real detrás porque ve las cifras y lee prosa
escrita a mano; y entra a la colección que le habla.

**FIRST VIEWPORT.** *Revisado el 2026-09-10: la sala ya no abre en tinta
pelada, abre en fotografía.* Una obra a sangre ocupa el primer viewport —
`_MG_7669.jpg`, el puesto al borde del camino en Japón— con "Shop" en Familjen
Grotesk apoyado sobre ella arriba a la izquierda y, contra el borde inferior,
las cifras verificables del archivo en DM Mono: 41 obras · 12 países · 4
colecciones. Es el mismo `.hero-section` de la portada, el about y cada
colección: /shop era el único eslabón de la cadena que abría con una línea de
texto en vez de con una obra. Al hacer scroll llega el muro, que no cambió:
cuatro paneles fotográficos a sangre de **ancho proporcional a la cantidad de
obras de cada colección** (5 · 7 · 8 · 21), History angosto, Portrait
dominando. El nombre de cada colección se lee sobre su panel; la acción
primaria es el panel entero, que es el enlace. La prosa de autor entra al
recorrer o tocar un panel.

La tapa del hero es un archivo del repositorio, no una fila de `photos`: no es
obra del catálogo, así que el muro no la anuncia ni la vende. Mismo trato que
la tapa de la portada.

Dos ajustes son de esta fotografía y no del sistema, y viven en
`.hero-section.shop-hero`: un velo radial de esquina, porque los trazos blancos
de la cortina caían detrás del titular y lo dejaban en 3,04:1 —ahora 4,80:1 en
desktop y 5,89:1 en móvil—, y un velo inferior que resuelve en `--ink` exacto en
vez de en un negro traslúcido, porque el borde de abajo del cuadro es un
mostrador a plena luz y cortado en seco dejaba una franja encendida entre el
hero y el muro, que son la misma tinta.

**FORM.** La sala oscura. Índice 5 de mi lista ordenada, líder de la mano en la
ronda de re-tirada 1, registro bolder. Seed key `2bccabe2`.

**FINISH.** unreviewed and unfinished

## Decisiones sin resolver

- La taxonomía colección-vs-destino sigue abierta en PRODUCT.md. Esta página se
  para sobre colección, que es lo que existe en la base, sin cerrar la
  pregunta: los 12 países aparecen como cifra, no como navegación.
- ~~La costura entre el header/footer en papel y esta página en tinta.~~
  **Resuelta.** `body:has(.shop-room)` baja la barra a tinta con el mismo
  mecanismo que ya usaba el hero, y `.shop-room` cierra con un filete
  `--footer-line` que marca el encuentro con el footer, que también es tinta.
- El muro quedó entero bajo la línea de flotación: el visitante ahora tiene que
  hacer un scroll para ver las cuatro colecciones. Es el precio de que /shop
  abra como abren el resto de las páginas, y la ficha de cifras del hero es lo
  que avisa que hay archivo abajo. Si alguna vez se mide que la entrada a las
  colecciones cae, ese es el primer lugar a mirar.
- ~~La banda de Portrait mide 840px en móvil, casi una pantalla.~~ **Resuelta
  el 2026-09-14**, a pedido del usuario: la altura lleva techo,
  `min(calc(var(--weight) * 40px), max(420px, 72svh))`. Portrait ya no llena el
  viewport, así que siempre asoma el filo de la banda siguiente y se lee como
  una de cuatro colecciones en vez de como una página. La proporción cede —de
  4,2× sobre Landscape a ~1,9×— y no se pierde; la cifra exacta la cantan igual
  el nombre y su `21 works`. El piso de 420px evita que en horizontal el techo
  baje del alto de Landscape y las dos bandas mayores queden iguales.
  Sigue en pie lo otro: el bloque de texto es `position: sticky` y por eso el
  panel no recorta (`overflow: visible`). Si alguna vez se agrega un efecto que
  necesite recorte en móvil, ese es el conflicto a mirar primero.
