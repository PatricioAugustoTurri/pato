import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta en `.next/standalone` solo lo que hace falta para correr, con un
  // `server.js` propio en vez de `next start`. Sin esto la imagen de Docker se
  // lleva los 601 MB de `node_modules`; con esto, una fraccion.
  output: "standalone",

  /* El cliente necesita saber si la portada es Rumbo Oeste para que la barra diga
     "The journey" en vez de "Home". Se hornea en el build, igual que las rewrites. */
  env: {
    NEXT_PUBLIC_RUMBO_OESTE: process.env.RUMBO_OESTE_ORIGIN ? "1" : "",
  },

  images: {
    // Ninguna fotografia pasa por el optimizador de Next. El catalogo lo sirve
    // Cloudinary desde su CDN, ya en el ancho y el formato que pide cada
    // pantalla; las fotos propias del sitio estan generadas de antemano por
    // `scripts/optimize-local-photos.mjs`. El loader decide cual es cual.
    //
    // Antes el servidor bajaba cada original de Cloudinary (2 a 4 MB) y lo
    // recomprimia con `sharp`: hasta 3 s de espera para el primero que pedia
    // cada tamaño, CPU del VPS en cada uno y un cache en disco que habia que
    // conservar entre deploys. Con un loader propio Next apaga ese
    // optimizador, asi que `remotePatterns`, `qualities` y `minimumCacheTTL`
    // ya no aplican y se retiraron.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",

    // Los anchos entre los que elige cada `srcset`. Los de fabrica saltan de
    // 1200 a 1920 y de 2048 a 3840, y en una retina eso hacia pedir casi el
    // doble de lo que se dibuja: una obra que ocupa 1267 px reales bajaba a
    // 1920 (627 KB) cuando a 1280 pesa 357. Con Cloudinary sirviendo, cada
    // ancho extra no le cuesta nada al servidor. Las fotos propias del sitio
    // estan generadas en menos anchos y el loader redondea hacia arriba.
    deviceSizes: [640, 750, 828, 1080, 1280, 1440, 1600, 1920, 2560, 2880, 3840],
  },

  /* Rumbo Oeste, el sitio del viaje en bici (repo `rumbo-oeste`, Astro estatico),
     es la portada de patoturri.com. Corre como otra app en Coolify y Next le pasa
     estas direcciones; todo lo demas (/shop, /about, /cart, /admin…) sigue aca.

     `beforeFiles` porque `/` tiene que ganarle a la home de Next. Mismo dominio a
     proposito: el viaje lee el carrito (`cart-storage`) y la transicion al shop no
     sale del sitio.

     Sin RUMBO_OESTE_ORIGIN no se agrega nada y la tienda queda como estaba. Tiene
     que estar en el BUILD (en Coolify, "Build Variable"): las rewrites se hornean
     al compilar. */
  async rewrites() {
    const rumbo = process.env.RUMBO_OESTE_ORIGIN?.replace(/\/$/, "");
    if (!rumbo) return [];
    return {
      beforeFiles: [
        { source: "/", destination: `${rumbo}/` },
        { source: "/en", destination: `${rumbo}/en` },
        { source: "/bitacora/:slug", destination: `${rumbo}/bitacora/:slug` },
        { source: "/en/bitacora/:slug", destination: `${rumbo}/en/bitacora/:slug` },
        { source: "/_rumbo/:path*", destination: `${rumbo}/_rumbo/:path*` },
        { source: "/rumbo-oeste.svg", destination: `${rumbo}/rumbo-oeste.svg` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async headers() {
    return [
      {
        // Las versiones optimizadas llevan un hash del original en el nombre:
        // si la foto cambia, cambia el archivo. Por eso se pueden guardar para
        // siempre en el navegador, y quien vuelve no las pide de nuevo.
        source: "/Pato/optimized/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
