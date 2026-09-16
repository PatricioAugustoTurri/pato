import type { Metadata } from "next";
import CollectionSection from "@/components/CollectionSection";
import DestinationsSection from "@/components/DestinationsSection";
import HeroSection from "@/components/HeroSection";
import StorySection from "@/components/StorySection";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  /* La marca va escrita entera acá porque la plantilla del layout raíz no se
     aplica a la página de su propio segmento —está documentado en
     `generate-metadata.md`—, y la portada es exactamente ese caso. */
  title: "Pato Turri · Travel Photography Prints",
  description:
    "Fine art travel photography prints by Pato Turri, printed to order in A4, A3 and A2. Shipped across Italy and the European Union.",
  path: "/",
});

/* La portada lee el catálogo a través de `DestinationsSection` y
   `CollectionSection`, pero lo lee por `pg` y no por `fetch`, así que Next no
   ve ninguna lectura que pueda caducar: prerrenderiza la página al compilar y
   la sirve congelada hasta el próximo deploy. Marcar una foto como preferida
   en el panel movía la base y no movía la portada.

   Una hora es la misma cifra que `/destinations/[country]`, y por la misma
   razón: el catálogo se edita desde el panel, no en un deploy, y en un
   servidor que se paga por mes conviene una consulta por hora antes que una
   por lector. */
export const revalidate = 3600;

export default function Home() {
  return (
    <div className="home" id="inicio">
      <HeroSection />
      <DestinationsSection />
      <CollectionSection />
      <StorySection />
    </div>
  );
}
