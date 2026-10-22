import { getArchiveCounts } from "@/lib/photos";
import SocialLinks from "@/components/SocialLinks";
import HeroCover from "@/components/HeroCover";
import HeroLive from "@/components/HeroLive";

/* La tapa (`HeroCover`) es el retrato del autor; este es su video vivo. */
const LIVE = "/Pato/_MG_7748-vivo.mp4";

export default async function HeroSection() {
  const counts = await getArchiveCounts();

  return (
    <section className="hero-section">
      <div className="hero-media">
        <HeroCover />
        {/* La misma toma, viva: el lago, los arboles y la niebla se mueven y la
            figura queda quieta. Generado con Higgsfield desde este archivo. El
            `media` es el encuadre de escritorio (`--cover-y: 52%`) en 16:10 o
            mas ancho, que es para lo que se recorto el video, y con puntero
            fino: en un aparato tactil la tapa es la toma sin figura y otro
            encuadre, y el video no le cae encima. */}
        <HeroLive src={LIVE} media="(min-width: 901px) and (min-aspect-ratio: 8/5) and (pointer: fine)" />
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
