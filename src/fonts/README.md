# Fuentes de compilación

`PlayfairDisplay-Italic.ttf` — Playfair Display, itálica variable.
Fuente: https://github.com/google/fonts/tree/main/ofl/playfairdisplay
Licencia: SIL Open Font License 1.1 (permite redistribución).

Está acá y no en `next/font` por una sola razón: la tarjeta de Open Graph se
dibuja con satori, que no lee los `woff2` que genera `next/font`, y necesita el
archivo en TTF. Es un insumo de compilación —la tarjeta se genera al hacer el
build— así que este archivo **no se le sirve nunca a un visitante**.

Existe porque el wordmark es un compromiso de marca: "Turri" va en Playfair
Display itálica y no cambia. Sin el archivo, satori lo dibujaba en la sans por
defecto y en redonda, que es exactamente lo que el wordmark no es.
