import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { DM_Sans, Familjen_Grotesk, Playfair_Display, DM_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import Providers from "./providers";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { personSchema, webSiteSchema } from "@/lib/structured-data";
import JsonLd from "@/components/JsonLd";
import { SOCIAL } from "@/components/SocialLinks";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
/* La voz display del sitio. Variable, con italica dibujada: los titulares la
   usan como acento ("contigo.", "de este mes.", "Mirar mejor."). */
const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-heading",
});
/* Playfair ya no titula: sobrevive solo para la firma "Pato / Turri", que es
   la marca y no cambia. Por eso carga un unico corte, el que usa el wordmark. */
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-wordmark",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  /* Sin esto, cada imagen y cada canónica relativa de todo el sitio se
     resuelve contra `localhost` en producción: las vistas previas al compartir
     un enlace salen rotas y Google ve canónicas que no apuntan a ningún lado. */
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} · Travel Photography Prints`,
    /* El nombre de la obra va primero y la marca después. Google corta el
       título cerca de los 60 caracteres, y "Pato Turri | " al principio gastaba
       13 de esos en cada página: lo primero que leía el buscador era siempre lo
       mismo en vez de qué tiene esa página. */
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR, url: SITE_URL }],
  creator: AUTHOR,
  publisher: AUTHOR,
  category: "photography",

  /* Sin `alternates` acá a proposito: una canónica declarada en el raíz la
     hereda toda página que no declare la suya, y media tienda terminaría
     diciéndole a Google que la versión buena de sí misma es la portada. Cada
     página pone la suya con `pageMetadata`. */

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      /* La línea que más importa en una tienda de fotografía: sin ella Google
         muestra una miniatura diminuta o ninguna. El producto es la imagen, así
         que el resultado de búsqueda tiene que poder mostrarla grande. */
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    url: SITE_URL,
    title: `${SITE_NAME} · Travel Photography Prints`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Travel Photography Prints`,
    description: SITE_DESCRIPTION,
    /* Sin `creator`: no hay cuenta de X/Twitter de Pato. Las redes reales
       —Instagram y YouTube— se declaran en el JSON-LD de `Person`, que es
       donde Google las usa para atar el sitio a la persona. */
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        dmSans.variable,
        familjenGrotesk.variable,
        playfairDisplay.variable,
        dmMono.variable
      )}
    >
      <body>
        {/* Quién es el autor y qué es este sitio, una sola vez para todo el
            dominio: las páginas de abajo solo describen su propia obra. */}
        <JsonLd data={personSchema(SOCIAL.map((account) => account.href))} />
        <JsonLd data={webSiteSchema()} />
        <Providers>
          <Toaster />
          <header>
            <NavBar />
          </header>
          <main>
            {children}
          </main>
          <footer>
            <Footer />
          </footer>
        </Providers>
      </body>
    </html>
  );
}
