import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { getCountryChapters } from "@/lib/photos";
import { countryIntro, countryLabel, countrySlug } from "@/lib/countries";

/* La portada y /destinations son el mismo indice con distinto alcance: una
   muestra los paises curados desde el panel y la otra todos los que tienen
   obra. Se comparte el componente en vez de copiarlo para que las dos no puedan
   contar cosas distintas ni separarse visualmente con el tiempo. */
export default async function DestinationsSection({
  heading = (
    <>
      My best <i>memories.</i>
    </>
  ),
  /* En la portada este indice es una franja mas y los paises cuelgan de ella;
     en /destinations es el asunto de la pagina. El nivel se pasa una sola vez y
     el del pais baja solo, asi que el orden de encabezados no puede saltarse un
     escalon en ninguna de las dos. */
  headingLevel = 2,
  curatedOnly = true,
  /* El nombre del país abre su archivo. Va apagado por defecto y lo enciende
     /destinations, que es donde el visitante vino a elegir un lugar: en la
     portada este índice es una franja de paso, y ahí la obra es la que se
     toca. Es una diferencia decidida y escrita, no una copia del componente
     que se separe con el tiempo. */
  linkCountries = false,
  empty = null,
}: {
  heading?: ReactNode;
  headingLevel?: 1 | 2;
  curatedOnly?: boolean;
  linkCountries?: boolean;
  empty?: ReactNode;
} = {}) {
  const chapters = await getCountryChapters(4, { curatedOnly });
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const CountryHeading = headingLevel === 1 ? "h2" : "h3";

  /* Sin capítulos no hay archivo que recorrer. En la portada eso es una franja
     que no se dibuja; una ruta propia tiene que decir algo, y lo pasa ella. */
  if (chapters.length === 0) {
    return empty;
  }

  return (
    <section className="home-section home-roll" id="destinos">
      {/* Era la unica franja de la home sin titulo propio: los paises colgaban
          directamente del h1. Con encabezado, cada pais pasa a ser un capitulo
          de esta seccion y no un hermano del titulo de la pagina. */}
      <div className="home-roll-head">
        <Heading>{heading}</Heading>
      </div>

      {chapters.map(({ country, photos, total }, index) => {
        const intro = countryIntro(country);
        // Los capítulos alternan de lado: el nombre pasa de un borde al otro y
        // la obra que pesa lo acompaña. Da ritmo a una lista que si no se
        // repite igual hacia abajo.
        const mirrored = index % 2 === 1;

        return (
          <article className="home-chapter" key={country} data-mirrored={mirrored || undefined}>
            <div className="home-chapter-head">
              <div className="home-chapter-mark">
                <CountryHeading>
                  {linkCountries ? (
                    <Link className="home-chapter-link" href={`/destinations/${countrySlug(country)}`}>
                      {countryLabel(country)}
                      {/* La misma flecha que marca cada puerta del sitio. El
                          nombre solo no dice que se pueda entrar, y subrayar
                          un titular de 152px sería una regla, no un enlace. */}
                      <span className="home-chapter-go" aria-hidden="true">↗</span>
                    </Link>
                  ) : (
                    countryLabel(country)
                  )}
                </CountryHeading>
                {/* Cifra contada contra la base, no una promesa de catálogo. */}
                <p className="home-chapter-count">
                  {total === 1 ? "1 work in the archive" : `${total} works in the archive`}
                </p>
              </div>
              {intro && <p className="home-chapter-note">{intro}</p>}
            </div>

            <div className="home-wall" data-count={photos.length}>
              {photos.map((photo, plateIndex) => {
                const imageUrl = normalizePhotoImage(photo.images);
                return (
                  <Link
                    className="home-plate"
                    key={photo.id}
                    href={`/shop/${photo.categorySlug}/${photo.slug}`}
                    // La primera obra del capítulo ocupa más ancho: la franja
                    // tiene una lectura, no cuatro paneles que pesan igual.
                    style={{ "--weight": plateIndex === 0 ? 1.45 : 1 } as CSSProperties}
                    aria-label={`${photo.name} — ${normalizePhotoAlt(photo.images, photo.name)}`}
                  >
                    <span
                      className="home-plate-image"
                      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                      aria-hidden="true"
                    />
                    <span className="home-plate-body">
                      <small>{photo.categoryName}</small>
                      <span className="home-plate-name">{photo.name}</span>
                    </span>
                    <span className="home-plate-go" aria-hidden="true">↗</span>
                  </Link>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
