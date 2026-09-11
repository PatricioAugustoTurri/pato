import Image from "next/image";

type CategoryHeroProps = {
  imageUrl: string;
  title: string;
  obras: number;
  paises: string[];
};

export default function CategoryHero({ imageUrl, title, obras, paises }: CategoryHeroProps) {
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
          {paises.length > 0 && (
            <div className="hero-index-now">
              <dt>Countries</dt>
              <dd>{paises.join(" · ")}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
