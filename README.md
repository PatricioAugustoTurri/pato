This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## El viaje (diario de Rumbo Oeste)

`/admin/viaje` es el panel del diario de viaje que se publica en el sitio de Rumbo Oeste
(otra app de Coolify, que lo lee al compilarse desde `/api/viaje`).

Las tablas `viaje_*` se crean solas en cada deploy (el Dockerfile corre
`scripts/migrate-viaje.mjs` antes del build) y la primera vez se siembran con los países de
`scripts/viaje-semilla.json`. En tu compu, una vez:

```bash
node --env-file=.env.local scripts/migrate-viaje.mjs scripts/viaje-semilla.json
```

Variables (en Coolify, en la app de la tienda):

| Variable | Para qué | Sin ella |
|---|---|---|
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Subir fotos y videos desde el teléfono directo a Cloudinary | El panel no puede subir archivos |
| `ANTHROPIC_API_KEY` | Traducir cada día al inglés al publicarlo (Claude Opus 5.5, esfuerzo bajo) | El inglés muestra el castellano |
| `COOLIFY_API_URL`, `COOLIFY_API_TOKEN`, `RUMBO_OESTE_COOLIFY_UUID` | Rehacer el sitio del viaje al publicar | Hay que redeployar Rumbo Oeste a mano |

Sin señal, el panel guarda los días en el teléfono (IndexedDB) y los sube cuando vuelve la
conexión; `public/viaje-sw.js` hace que la página abra sin red.

Para cargar rápido desde la ruta:

- **Dictar**: el botón «Dictar» escribe mientras hablás (reconocimiento de voz del navegador,
  necesita señal) y «Ordenar» deja el texto con puntuación y párrafos sin cambiar lo dicho
  (Claude, necesita `ANTHROPIC_API_KEY`).
- **Recorrido**: el .fit o .gpx del Garmin o el Wahoo completa fecha, hora de salida, km,
  desnivel y dónde arrancó y terminó el día (se lee en el teléfono, sin señal).
- **Lugares y clima**: al guardar, el servidor completa «desde» y «hasta» con el nombre del
  lugar (la parada de la ruta si está a menos de 20 km, si no OpenStreetMap) y el clima de
  esa hora (Open-Meteo). Nunca pisa lo escrito a mano.
- **Ponerme al día**: muchas fotos, videos y recorridos juntos; se arma un día por fecha.
- **Compartir desde la galería (Android)**: con el panel instalado en la pantalla de inicio,
  aparece «El viaje» en el menú Compartir (`share_target` en `public/viaje.webmanifest`).
