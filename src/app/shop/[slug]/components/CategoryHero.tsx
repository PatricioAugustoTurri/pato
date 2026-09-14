import Image from "next/image";

type CategoryHeroProps = {
  imageUrl: string;
  title: string;
  obras: number;
  /* La segunda cifra de la ficha es el OTRO eje del archivo, y cuál es
     depende de qué sala abre esta tapa: una colección se cuenta por los
     países que recorre, un país por las colecciones que atraviesa. Es la
     misma ficha leída al revés, así que es un rótulo y una lista, no dos
     componentes que se parecen. */
  indexLabel?: string;
  indexValues: string[];
};

export default function CategoryHero({
  imageUrl,
  title,
  obras,
  indexLabel = "Countries",
  indexValues,
}: CategoryHeroProps) {
  return (
    <section className="hero-section">
      {/* Mismo elemento y mismo <Image> que la portada: así la fotografía se
          asienta con la misma entrada, en vez de aparecer de golpe como hacía
          cuando era un fondo CSS del propio bloque. */}
      {imageUrl && (
        <div className="hero-media">
          <Image src={imageUrl} alt="" fill priority sizes="100vw" quality={90} />
        </div>
      )}

      <div className="hero-inner">
        <h1 className="hero-title">{title}</h1>

        <dl className="hero-index">
          <div><dt>Works</dt><dd>{obras}</dd></div>
          {indexValues.length > 0 && (
            <div className="hero-index-now">
              <dt>{indexLabel}</dt>
              <dd>{indexValues.join(" · ")}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
