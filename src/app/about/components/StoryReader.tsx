import Image from "next/image";
import Link from "next/link";
import { CHAPTERS, PAGE_TITLE, STORY_INDEX, UI } from "@/app/about/story";
import { countryLabel } from "@/lib/countries";

export type AnchoredPhoto = {
  slug: string;
  categorySlug: string;
  name: string;
  pais: string;
  url: string;
  alt: string;
  /* ancho/alto del original: 1.5 = 3:2 horizontal, 0.667 = 2:3 vertical */
  ratio: number;
};

/* La página abre en inglés, que es el idioma del sitio. El texto en castellano
   —el original, la voz del autor— sigue escrito entero en story.ts y los tipos
   siguen siendo bilingües: cambiar esta constante alcanza para volver, y el
   conmutador puede reaparecer sin reescribir nada. */
const LANG = "en" as const;

const COVER = "/Pato/R0000371.jpg";

export default function StoryReader({ photos }: { photos: Record<string, AnchoredPhoto> }) {
  const ui = UI[LANG];

  /* Alterna que lado de cada par lleva la obra dominante. Se reinicia en cada
     render, asi que es determinista. */
  let plateGroup = 0;

  return (
    <main className="story-page">
      {/* Mismo mecanismo que la portada, no una copia: reusa `.hero-section`,
          asi que hereda el velo doble, la entrada escalonada y la navegacion
          apoyada sobre la fotografia en vez de empujarla hacia abajo. */}
      <section className="hero-section">
        <div className="hero-media">
          <Image src={COVER} alt={ui.heroAlt} fill priority sizes="100vw" quality={90} />
        </div>

        <div className="hero-inner">
          <h1 className="hero-title">{PAGE_TITLE[LANG]}</h1>

          {/* Las cifras salen del propio relato —"Cinco años, cerca de veinte
              países, cuatro continentes"—, no de una estimación nuestra. */}
          <dl className="hero-index">
            {STORY_INDEX.map(({ label, value }) => (
              <div key={label[LANG]}>
                <dt>{label[LANG]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <article className="story-body" lang={LANG}>
        {CHAPTERS.map((chapter) => (
          <section className="story-chapter" key={chapter.id}>
            {chapter.title && <h2>{chapter.title[LANG]}</h2>}

            {chapter.blocks.map((block, index) => {
              if (block.kind === "p") {
                return <p key={index}>{block.text[LANG]}</p>;
              }

              const found = block.slugs.map((slug) => photos[slug]).filter(Boolean);
              if (found.length === 0) return null;

              const side = plateGroup++ % 2 === 0 ? "left" : "right";

              return (
                <figure
                  className="story-plates"
                  data-count={found.length}
                  data-side={side}
                  key={index}
                >
                  {found.map((photo) => (
                    <Link
                      className="story-plate"
                      key={photo.slug}
                      href={`/shop/${photo.categorySlug}/${photo.slug}`}
                      /* El ancho de la obra en la fila y su caja salen de su
                         propia proporcion: asi no hay recorte. */
                      style={{ "--ratio": photo.ratio } as React.CSSProperties}
                    >
                      <Image
                        className="story-plate-image"
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 760px) 100vw, 45vw"
                        quality={80}
                      />
                      {/* El pie vive dentro de la obra, como los lomos de la
                          tienda: la fotografia no cede ancho a un rotulo. */}
                      <span className="story-plate-meta">
                        <small>{countryLabel(photo.pais)}</small>
                        <b>{photo.name}</b>
                      </span>
                    </Link>
                  ))}
                </figure>
              );
            })}
          </section>
        ))}

        <p className="story-close">
          <Link className="text-link" href="/shop">
            {ui.archive} <span aria-hidden="true">↗</span>
          </Link>
        </p>
      </article>
    </main>
  );
}
