import Image from "next/image";
import { getArchiveCounts } from "@/lib/photos";
import SocialLinks from "@/components/SocialLinks";
import HeroLive from "@/components/HeroLive";

/* La tapa de la portada es el retrato del autor, no una obra del catálogo. Por
   eso es un archivo del repositorio y no sale de `photos`: ninguna bandera del
   panel la elige, y el índice de abajo no anuncia "En portada" porque lo que se
   ve no es una obra que se pueda comprar. */
const COVER = "/Pato/_MG_7748.jpg";
const LIVE = "/Pato/_MG_7748-vivo.mp4";
const COVER_ALT =
  "Pato Turri standing with one arm raised, in front of a lake and a snow-capped mountain";

export default async function HeroSection() {
  const counts = await getArchiveCounts();

  return (
    <section className="hero-section">
      <div className="hero-media">
        <Image src={COVER} alt={COVER_ALT} fill priority sizes="100vw" quality={90} />
        {/* La misma toma, viva: el lago, los arboles y la niebla se mueven y la
            figura queda quieta. Generado con Higgsfield desde este archivo. El
            `media` es el encuadre de escritorio (`--cover-y: 52%`) en 16:10 o
            mas ancho, que es para lo que se recorto el video. */}
        <HeroLive src={LIVE} media="(min-width: 901px) and (min-aspect-ratio: 8/5)" />
      </div>

      {/* El retrato y el titular no se cruzan: en apaisado el titular vive
          arriba a la izquierda, sobre los arboles, y la figura queda libre en
          el centro; en vertical la fotografia va entera arriba y el titular
          debajo, como un epigrafe. Antes una silueta recortada se dibujaba
          encima del titular para que el texto le pasara por detras, y lo que
          se leia era al autor tapando su propia frase. Se retiro por pedido
          del autor (2026-10-15). */}
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
