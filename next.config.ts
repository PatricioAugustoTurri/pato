import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Todo el catálogo vive en esta cuenta de Cloudinary. Declararla permite
    // que `next/image` optimice las fotografías en vez de servirlas crudas:
    // en una tienda de fotografía, el peso de la imagen es el peso del sitio.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dvmsjdcqi/**",
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
