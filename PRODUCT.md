# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Compradores de impresiones fotográficas de viaje, en la UE, pagando en EUR.
Confirmados como audiencias reales, sin una sola primaria declarada:
seguidores existentes de Pato; compradores fríos que buscan fine-art prints;
gente amueblando un espacio concreto; compradores de regalo.
Segunda audiencia: el propio Pato como administrador (catálogo, pedidos, roles).

## Product Purpose

Vender impresiones de las fotografías de viaje de Pato Turri, con checkout
propio, envío a Italia y al resto de la UE, y un panel de administración para
gestionar catálogo, pedidos y clientes.

## Positioning

Tienda de un solo autor: el catálogo entero son fotografías propias, agrupadas
en colecciones con texto editorial escrito para cada una (History, City,
Landscape, Portrait). No es un marketplace ni un catálogo licenciado.

## Operating Context

- Navegación: home → /shop → categoría → foto → carrito → Stripe Checkout.
  **El catálogo se navega por colección** (decisión del usuario, 2026-10-15):
  la portada abre con el mismo muro de colecciones que /shop
  (`HomeCollections` → `CollectionWall`), y el archivo por país baja a franja
  secundaria. Las colecciones sin obras no se ofrecen (`getCollections`).
- **Comprar no pide cuenta** (2026-10-15). `/api/checkout` acepta compras sin
  sesión: Stripe pide email y dirección. Con sesión, el pedido se cuelga de
  `user_id` y aparece en /account; sin ella queda sin dueño y la confirmación
  por mail es la constancia. Los pedidos sin cuenta NO se asocian por email a
  una cuenta: no hay verificación de email, así que cualquiera podría
  registrarse con un email ajeno y ver esos pedidos.
- Carrito en zustand con persist a localStorage (`cart-storage`), deduplicado
  por (photoId, size).
- Checkout re-tarifa en el servidor desde `photo_variants`; el precio del
  cliente nunca se confía. El webhook `checkout.session.completed` pasa el
  pedido a `paid`, descuenta stock y manda dos mails por Resend: la
  confirmación al comprador (en inglés) y el aviso de venta a
  `CONTACT_TO_EMAIL` (en castellano, con obras, tamaños y dirección de envío).
  Los dos salen después de responderle a Stripe y ninguno puede hacer fallar un
  cobro ya procesado. La página de Stripe muestra, sobre el botón de pagar, que
  pagar acepta las condiciones de /terms (`custom_text.submit`).
- Envío: "Envío en Italia" €5,00 (2-5 días hábiles) y "Envío al resto de la
  Unión Europea" €10,00 (4-10 días hábiles). Stripe recolecta dirección en 27
  países de la UE y teléfono.
- Admin en /admin (fotografías), /admin/collections, /admin/featured (qué obras
  llenan las dos franjas curadas de la portada), /admin/sizes (lista de precios),
  /admin/orders y /admin/customers, con login separado en /admin/login.

## Capabilities and Constraints

- Tamaños y precios uniformes en todo el catálogo, en EUR: no hay precio por
  fotografía. La lista vive en la tabla `catalog_sizes` y se edita desde
  /admin/sizes; arranca en A4 €40,00 · A3 €55,00 · A2 €70,00. Guardarla propaga
  el precio a `photo_variants` de toda obra, que es lo que lee el checkout. Las
  medidas de cada tamaño son un hecho del papel y siguen en `src/lib/sizes.ts`.
- Roles: `customer` y `admin`. Registro siempre crea `customer`. Los admins se
  crean con `scripts/create-admin.mjs` o se promueven desde /admin/customers.
  El sistema se niega a degradar al último admin.
- Auth: NextAuth v5 beta, solo Credentials (email + bcrypt). Sin OAuth, sin
  verificación de email. **Recuperación de contraseña** (2026-10-15):
  /forgot-password → mail por Resend con enlace de un solo uso y una hora de
  vida → /reset-password. Tabla `password_resets` (solo el SHA-256 del token);
  migración `scripts/migrate-password-resets.mjs`. El enlace se arma con
  `NEXT_PUBLIC_SITE_URL`, nunca con el `Host` del pedido.
- Datos: Postgres con SQL crudo (`pg`), sin ORM. Tablas `categories`, `photos`,
  `photo_variants`, `catalog_sizes`, `orders`, `users`, `password_resets`
  (+ `admin_users` legacy sin uso).
- **Analítica: Umami** en el mismo servidor (servicio `umami` del
  docker-compose, base `umami` en el mismo Postgres), sin cookies ni IPs, así
  que no hay banner. Se carga solo si están `NEXT_PUBLIC_UMAMI_SRC` y
  `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (son de build: van como ARG en el
  Dockerfile). Eventos: `add_to_cart`, `checkout_start`, `purchase`
  (`src/lib/analytics.ts`). El panel /admin no se cuenta.
- **Situación fiscal** (decisión del usuario, 2026-10-15): vende como persona
  física, de forma ocasional, **sin Partita IVA**; no se cobra IVA. Vive en
  `src/lib/seller.ts`, que leen /terms y el pie. Si abre P.IVA hay que mostrar
  el número en el pie y revisar precios e IVA.
- Pruebas: `npm test` (vitest) sobre la validación del carrito
  (`src/lib/checkout-cart.ts`) y las tarifas de envío.
- Imágenes del catálogo alojadas en Cloudinary (cuenta `dvmsjdcqi`).
- **Entrega de imágenes** (2026-10-15): ninguna pasa por el optimizador de
  Next. `src/lib/image-loader.ts` (loader propio de `next/image`) le pide a
  Cloudinary cada foto del catálogo en el ancho justo (`f_auto,q_auto`,
  `q_auto:best` desde calidad 88) y la sirve su CDN. Los originales de la base
  no se tocan: son los que se imprimen. Las fotos propias del sitio (portada,
  tienda, historia) viven en `src/assets/photos/` —ya no en `public/`, donde
  se podían bajar enteras— y `scripts/optimize-local-photos.mjs` genera sus
  versiones WebP en `public/Pato/optimized/` con hash en el nombre (caché de un
  año). Foto propia nueva o reemplazada → correr ese script.
- Guardas en `src/proxy.ts` (nombre de middleware en Next 16) sobre
  `/admin/*` y `/api/admin/*`. `/api/checkout` ya no está guardada: comprar
  no pide cuenta.
- **Máximo 10 copias de una misma obra en el mismo tamaño**, por decisión del
  usuario (2026-09-17): es lo que está dispuesto a imprimir de una sentada para
  un pedido, no una restricción de existencias. Vive en `src/lib/cart-limits.ts`
  y lo hace cumplir `/api/checkout` después de sumar las líneas repetidas; el
  carrito apaga el botón `+` al llegar, que es comodidad y no la guarda.
- **La insignia del carrito cuenta productos distintos, no copias**: coincide
  con las filas que se ven al abrir el carrito. La página del carrito sí dice
  las dos cifras ("11 prints · 2 works").
- **No hay existencias y el sitio no las cuenta.** Confirmado por el usuario el
  2026-09-17: nada está impreso de antemano, cada copia se hace cuando alguien
  la compra. El número de stock que había en la base era simbólico. Por eso
  ninguna pantalla lo lee: la ficha no dice "Sold out", el checkout no rechaza
  por cantidad, el webhook no descuenta, el panel ya no pide el número y el dato
  estructurado declara `InStock` siempre. La columna sigue en la base, sin uso.
  Antes de esto una obra —«Red Bridge»— estaba publicada como agotada y
  anunciada a Google como `OutOfStock` sin motivo.
- El panel crea, renombra y borra colecciones, pero se niega a borrar una que
  todavía tenga obras: la llave es `ON DELETE SET NULL` y una obra sin colección
  no tiene ruta, así que desaparecería de la tienda sin que nadie lo pida.
- El slug de una colección no se edita: es la dirección pública de
  `/shop/<colección>` y cambiarla rompería los enlaces ya compartidos.

### Decisiones abiertas (no inventar)

- **Producción e impresión**: la impresión bajo demanda SÍ está confirmada por
  el usuario (2026-09-17). Lo que sigue sin confirmar es el **papel y el
  laboratorio**: la copia actual afirma papeles de algodón y eso no está
  verificado. No repetirlo en copia nueva hasta que se confirmen.

## Brand Commitments

- Nombre: **Pato Turri**. Wordmark tipográfico en dos líneas ("Pato" / "Turri").
  No hay logotipo en la interfaz: la marca en pantalla es siempre el wordmark.
  El único signo gráfico es el **icono del sitio** —un dibujo a plumín de una
  cámara telemétrica, elegido por el usuario el 2026-09-12—, que vive solo en
  la pestaña del navegador y en la pantalla de inicio; el original está en
  `src/assets/camera-source.png`. "Turri" va en
  Playfair Display itálica y **no cambia**: es el único resto de esa familia en
  el sitio, y vive en su propia variable `--font-wordmark` para sobrevivir a
  cualquier cambio de la cara de títulos.
- **Firma "PT" sobre las obras del catálogo** (decisión del usuario,
  2026-10-15): "PT" en Playfair Display itálica —la cara de "Turri"—, abajo a
  la derecha, en papel con una sombra difusa en tinta. La estampa Cloudinary
  dentro del archivo (`WATERMARK` en `src/lib/cloudinary.ts`), así que la lleva
  también la imagen que alguien guarda. Solo en el catálogo y desde 600 px de
  ancho: las miniaturas (carrito, pedidos, mails) y las fotos propias del sitio
  (portada, tienda, historia) van sin firma.
- Tipografías en uso: **Familjen Grotesk** (títulos, con itálica como acento),
  DM Sans (texto), DM Mono (etiquetas y metadatos). La cara de títulos era
  Playfair Display hasta el 2026-09-10; se reemplazó por decisión del usuario
  ("más moderno"). La itálica es requisito, no adorno: tres titulares la usan
  como acento (`contigo.`, `de este mes.`, `Mirar mejor.`), así que cualquier
  reemplazo futuro debe traer itálica dibujada, no sintética.
- Email de contacto publicado en la UI: info@patoturri.com
- Idioma del sitio: **inglés** (decisión del usuario). La UI en español
  rioplatense actualmente en el código es un remanente a traducir.

## Evidence on Hand

- **21 fotografías reales** en Cloudinary con títulos editoriales propios
  (Ayutthaya, Popocatépetl, Antigua, Aconcagua, Hanoi, Chapada Diamantina,
  Chiang Mai, Guaraní, Salta, Vietnam…).
- **4 colecciones con descripciones editoriales largas y propias**, ya escritas.
- **El sitio vende de verdad.** Stripe pasó a claves LIVE el 2026-09-17: un
  cobro es dinero real. Test y live son mundos separados en Stripe, así que el
  webhook tiene que estar dado de alta en el dashboard LIVE apuntando a
  `/api/webhooks/stripe`, y `STRIPE_WEBHOOK_SECRET` tiene que ser el de ESE
  endpoint. Con el secreto de test puesto, un comprador paga y no pasa nada:
  el pedido se queda en `pending`, el stock no baja y no sale ningún mail.
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está declarada pero ningún código la
  lee —el checkout redirige a la página alojada de Stripe—, así que no
  interviene.
- El checkout no guarda ningún id de objeto de Stripe: precios y tarifas se
  arman inline (`price_data`, `shipping_rate_data`), que es lo que permitió
  cambiar de modo sin tocar código.
- Las cuatro colecciones tienen obra (la de Portrait estaba vacía; ya no).
- **No existe fotografía propia en el repositorio.** Toda la imaginería de la
  home y del about es stock remoto de Unsplash hardcodeado en `globals.css`.
  Los "destinos" Portugal / Islandia / Marruecos y los productos "Lagos de
  sal" / "Tierra roja" / "La ultima luz" son inventados: no existen en la base
  y no deben tratarse como catálogo real.
- Sin testimonios, sin prensa, sin métricas de ventas. No fabricar ninguno.
- Páginas legales: /terms (condiciones de venta, 2026-10-15), /privacy,
  /shipping, /returns. Las condiciones enlazan a envío y devoluciones en vez
  de repetirlas, para que no haya dos versiones de la misma regla.

## Product Principles

1. **La fotografía es el producto.** Toda decisión de interfaz que compita con
   la imagen está mal resuelta.
2. **Solo trabajo propio.** El sitio nunca muestra fotografía que no sea de
   Pato; el stock actual es andamiaje a retirar, no un recurso.
3. **El precio se decide en el servidor.** El cliente propone, `photo_variants`
   dispone.
4. **Un solo autor, una sola voz.** Las descripciones de colección son texto de
   autor, no relleno de SEO.
5. **No prometer lo que no se cumple.** Nada de plazos, papeles ni emails de
   confirmación en la copia mientras no exista el mecanismo detrás.

## Accessibility & Inclusion

Sin requisito específico establecido por el usuario. Objetivo por defecto:
WCAG 2.2 AA. Estado actual conocido: el acento de marca sobre el fondo papel
mide 2.44:1 y `--text-faint` 3.66:1, ambos por debajo de AA; y no existe
ninguna guarda `prefers-reduced-motion` en el proyecto.
