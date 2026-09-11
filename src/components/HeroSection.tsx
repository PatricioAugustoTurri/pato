import Image from "next/image";
import { getArchiveCounts } from "@/lib/photos";

/* La tapa de la portada es el retrato del autor, no una obra del catálogo. Por
   eso es un archivo del repositorio y no sale de `photos`: ninguna bandera del
   panel la elige, y el índice de abajo no anuncia "En portada" porque lo que se
   ve no es una obra que se pueda comprar. */
const COVER = "/Pato/_MG_7748.jpg";
const COVER_ALT =
  "Pato Turri de pie con el brazo en alto, frente a un lago y una montaña nevada";

/* Marcas dibujadas, no glifos ni una fuente de iconos: mismo lienzo de 24, mismo
   trazo de 1,5 y mismas uniones redondeadas, para que las dos se lean como un
   solo juego y no como dos logos pegados de sitios distintos. */
const SOCIAL = [
  {
    name: "Instagram",
    href: "https://www.instagram.com",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com",
    icon: (
      <>
        <rect x="2.2" y="5" width="19.6" height="14" rx="4.2" />
        <path d="M10.3 9.5 15.2 12l-4.9 2.5V9.5Z" />
      </>
    ),
  },
];

export default async function HeroSection() {
  const counts = await getArchiveCounts();

  return (
    <section className="hero-section">
      <div className="hero-media">
        <Image src={COVER} alt={COVER_ALT} fill priority sizes="100vw" quality={90} />
      </div>

      <div className="hero-inner">
        <h1 className="hero-title">
          Lleva el mundo<br /><i>contigo.</i>
        </h1>

        <div className="hero-foot">
          <ul className="hero-social">
            {SOCIAL.map(({ name, href, icon }) => (
              <li key={name}>
                {/* El nombre va en `aria-label` porque el dibujo no dice nada a
                    un lector de pantalla; el svg queda oculto para no repetirlo. */}
                <a
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {icon}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Ficha técnica del archivo: cifras verificables contra el catálogo,
            no métricas de vanidad. */}
        <dl className="hero-index">
          <div><dt>Obras</dt><dd>{counts.obras}</dd></div>
          <div><dt>Países</dt><dd>{counts.paises}</dd></div>
          <div><dt>Colecciones</dt><dd>{counts.colecciones}</dd></div>
        </dl>
      </div>
    </section>
  );
}
