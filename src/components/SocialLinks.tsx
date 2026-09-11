/* Las dos cuentas del sitio, en un solo lugar.
   Vivían dentro de `HeroSection`; cuando el pie las necesitó, copiarlas habría
   dejado dos juegos de marcas y dos direcciones que pueden separarse. La marca
   se dibuja acá y la usan los dos.

   Marcas dibujadas, no glifos ni una fuente de iconos: mismo lienzo de 24, mismo
   trazo de 1,5 y mismas uniones redondeadas, para que las dos se lean como un
   solo juego y no como dos logos pegados de sitios distintos. */
export const SOCIAL = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/patoturri_",
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
    href: "https://www.youtube.com/@pato_turri",
    icon: (
      <>
        <rect x="2.2" y="5" width="19.6" height="14" rx="4.2" />
        <path d="M10.3 9.5 15.2 12l-4.9 2.5V9.5Z" />
      </>
    ),
  },
];

/**
 * La lista de cuentas. `className` decide el tamaño y el color desde el lugar
 * que la usa —el hero y el pie tienen goteras distintas—, pero el dibujo, las
 * direcciones y el nombre accesible son los mismos en los dos.
 */
export default function SocialLinks({ className }: { className: string }) {
  return (
    <ul className={className}>
      {SOCIAL.map(({ name, href, icon }) => (
        <li key={name}>
          {/* El nombre va en `aria-label` porque el dibujo no dice nada a un
              lector de pantalla; el svg queda oculto para no repetirlo. */}
          <a href={href} aria-label={name} target="_blank" rel="noreferrer">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {icon}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
