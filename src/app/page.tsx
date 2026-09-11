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
