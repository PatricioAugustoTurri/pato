import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { DM_Sans, Familjen_Grotesk, Playfair_Display, DM_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import Providers from "./providers";

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
  title: "Pato Turri | Photographs That Take You Far",
  description: "Travel photography prints, made to be lived slowly.",
  keywords: ["travel photography", "fine art prints", "street photography", "Malaysia photography", "night market photography"],
  authors: [{ name: "Pato Turri" }],
  openGraph: {
    title: "Pato Turri | Photographs That Take You Far",
    description: "Travel photography prints, made to be lived slowly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pato Turri | Photographs That Take You Far",
    description: "Travel photography prints, made to be lived slowly.",
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
