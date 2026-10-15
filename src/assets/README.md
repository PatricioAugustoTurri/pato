# Fuentes de los iconos

`camera-source.png` — el dibujo original del que salen `src/app/icon0.png`,
`src/app/icon1.png` y `src/app/apple-icon.png`.

Vive acá y no en `public/` a propósito: en `public/` se le serviría a
cualquiera, y son 257 KB que nadie pide. Acá es solo el original del que se
regeneran los iconos si hace falta rehacerlos.

Los iconos se generan recortando el cuerpo de la cámara (sin la correa, que a
32 px se convierte en ruido) y componiéndolo sobre el papel de la marca
(`--paper`, #f4f1eb). El fondo va pintado y no transparente porque la tinta del
dibujo es negra: sobre una pestaña de navegador en modo oscuro, un PNG
transparente desaparecería.
