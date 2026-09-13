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
  },
};

export default nextConfig;
