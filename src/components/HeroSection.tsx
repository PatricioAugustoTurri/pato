import Image from "next/image";
import { getArchiveCounts } from "@/lib/photos";
import SocialLinks from "@/components/SocialLinks";

/* La tapa de la portada es el retrato del autor, no una obra del catálogo. Por
   eso es un archivo del repositorio y no sale de `photos`: ninguna bandera del
   panel la elige, y el índice de abajo no anuncia "En portada" porque lo que se
   ve no es una obra que se pueda comprar. */
const COVER = "/Pato/_MG_7748.jpg";
const COVER_ALT =
  "Pato Turri standing with one arm raised, in front of a lake and a snow-capped mountain";

export default async function HeroSection() {
  const counts = await getArchiveCounts();

  return (
    <section className="hero-section">
      <div className="hero-media">
        <Image src={COVER} alt={COVER_ALT} fill priority sizes="100vw" quality={90} />
      </div>

      <div className="hero-inner">
        <h1 className="hero-title">
          Take the world<br /><i>with you.</i>
        </h1>

        <div className="hero-foot">
          <SocialLinks className="hero-social" />
        </div>

        {/* Ficha técnica del archivo: cifras verificables contra el catálogo,
            no métricas de vanidad. */}
        <dl className="hero-index">
          <div><dt>Works</dt><dd>{counts.obras}</dd></div>
          <div><dt>Countries</dt><dd>{counts.paises}</dd></div>
          <div><dt>Collections</dt><dd>{counts.colecciones}</dd></div>
        </dl>
      </div>
    </section>
  );
}
