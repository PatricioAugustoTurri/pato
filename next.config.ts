import type { NextConfig } from "next";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_HOST } from "./src/lib/cloudinary";

const nextConfig: NextConfig = {
  // Empaqueta en `.next/standalone` solo lo que hace falta para correr, con un
  // `server.js` propio en vez de `next start`. Sin esto la imagen de Docker se
  // lleva los 601 MB de `node_modules`; con esto, una fraccion.
  output: "standalone",

  images: {
    // Todo el catálogo vive en esta cuenta de Cloudinary. Declararla permite
    // que `next/image` optimice las fotografías en vez de servirlas crudas:
    // en una tienda de fotografía, el peso de la imagen es el peso del sitio.
    remotePatterns: [
      {
        protocol: "https",
        hostname: CLOUDINARY_HOST,
        pathname: `/${CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],

    // Next 16 dejo de aceptar cualquier `quality` y ahora solo sirve las que
    // esten declaradas aca: sin esta lista, los `quality={90}` de los heroes y
    // los `quality={85}` del muro se degradaban en silencio a 75. En una
    // tienda de fotografia esa diferencia es el producto.
    qualities: [75, 85, 90],

    // Cuanto dura una imagen ya optimizada antes de que haya que volver a
    // generarla. El valor de fabrica son cuatro horas, y con eso los heroes se
    // re-comprimian varias veces por dia: cada vez que caducaba, el primero en
    // entrar esperaba ~2,5 s a que `sharp` rehiciera un WebP de 2,5 MB que ya
    // estaba bien. Treinta y un dias es tambien el `max-age` que se lleva el
    // navegador, asi que al que vuelve no le cuesta nada.
    //
    // La contra, y hay que saberla: no existe forma de invalidar este cache. Un
    // archivo de `public/Pato/` que se reemplace CON EL MISMO NOMBRE sigue
    // sirviendose viejo hasta que caduque, porque el cache sobrevive al deploy
    // en su volumen. Para cambiar una foto, cambiarle el nombre. El catalogo no
    // corre ese riesgo: sus URLs de Cloudinary llevan version.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
