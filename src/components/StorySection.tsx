import Image from "next/image";
import Link from "next/link";

/* La franja de cierre de la home lleva su propia fotografía, como el hero.
   A diferencia de la tapa, esta NO va con `priority`: está al pie de la
   página, así que debe cargar perezosa en vez de competir por el ancho de
   banda con lo que el visitante está mirando. */
const STORY_COVER = "/Pato/R0000300.jpg";
const STORY_COVER_ALT =
  "Pato Turri leaning against a stone building on a mountainside, under a clear sky";

export default function StorySection() {
  return (
    <section className="home-section home-colophon" id="historia">
      <div className="home-colophon-media">
        <Image src={STORY_COVER} alt={STORY_COVER_ALT} fill sizes="100vw" quality={85} />
      </div>

      {/* La itálica no es adorno: es uno de los tres titulares del sitio que la
          llevan como acento, y PRODUCT.md la registra como compromiso de marca.
          El título cambió de palabras, no de voz. */}
      <h2>
        My <i>story.</i>
      </h2>

      <div className="home-colophon-copy">
        {/* Resumen del relato de /about, no una promesa nueva: el taller
            mecánico abre el primer capítulo, la cuenta de años y continentes es
            literal del último, y la segunda frase es la tesis del texto —el
            paisaje se acostumbra, la gente no—. */}
        <p>
          I left a mechanic&apos;s workshop in Argentina with a backpack and a question. Five years
          and four continents later: you get used to the landscape, never to the people.
        </p>
        <Link className="text-link" href="/about">
          Read the story <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
