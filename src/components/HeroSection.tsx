import Image from "next/image";
import { getArchiveCounts } from "@/lib/photos";
import SocialLinks from "@/components/SocialLinks";

/* La tapa de la portada es el retrato del autor, no una obra del catálogo. Por
   eso es un archivo del repositorio y no sale de `photos`: ninguna bandera del
   panel la elige, y el índice de abajo no anuncia "En portada" porque lo que se
   ve no es una obra que se pueda comprar. */
const COVER = "/Pato/_MG_7748.jpg";
/* La misma toma, recortada a la silueta con alfa. No es otra fotografía: es
   este archivo, y por eso cae exactamente sobre su propio cuerpo mientras los
   dos encuadres compartan `--cover-y`. La matte la genera Vision, la misma
   segmentación con la que macOS levanta un sujeto de una foto. */
const FIGURE = "/Pato/_MG_7748-figura.webp";
const COVER_ALT =
  "Pato Turri standing with one arm raised, in front of a lake and a snow-capped mountain";

export default async function HeroSection() {
  const counts = await getArchiveCounts();

  return (
    <section className="hero-section">
      <div className="hero-media">
        <Image src={COVER} alt={COVER_ALT} fill priority sizes="100vw" quality={90} />
      </div>

      {/* La figura otra vez, por encima de los velos y del titular: así el texto
          le pasa por detrás donde se cruzan, y el cuerpo sale del velo en vez de
          hundirse en él. No lleva texto alternativo porque no es una imagen
          nueva —la de abajo ya la describe— y no recibe clics. */}
      <div className="hero-cutout" aria-hidden="true">
        {/* `unoptimized` a proposito, y no se saca. El optimizador elige formato
            segun lo que acepta el cliente: al que no anuncia webp le devuelve un
            JPEG, y un JPEG no tiene alfa, asi que el recorte le llega con el
            fondo aplanado en negro —la tapa entera negra menos la figura—.
            Servido tal cual, el navegador que no entiende webp no dibuja nada y
            la portada queda como estaba, que es la unica falla aceptable de las
            dos. Son 205 KB fijos y de paso no hay que optimizar nada por pedido
            en el servidor. */}
        <Image src={FIGURE} alt="" fill priority unoptimized />
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
