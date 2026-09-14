import Link from "next/link";
import DestinationsSection from "@/components/DestinationsSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Destinations",
  description:
    "Every country in the archive — from Thailand and Vietnam to Mexico, Guatemala, Brazil and Argentina — with the work that came out of it.",
  path: "/destinations",
});

/* El mismo indice que cierra la portada, con todo el archivo en vez de los
   paises curados. Va envuelto en `.home` para heredar exactamente la misma
   sala —fondo de tinta y colores de encabezado— en vez de declarar una copia
   que podria separarse con el tiempo. */
export default function DestinationsPage() {
  return (
    /* `is-dark-room` baja la barra a tinta. Sin ella, una banda de papel de 88px
       queda pegada a una pagina de tinta y a un pie de tinta. */
    <div className="home is-dark-room">
      <DestinationsSection
        heading={
          <>
            Every <i>destination.</i>
          </>
        }
        headingLevel={1}
        curatedOnly={false}
        /* Acá el visitante vino a elegir un lugar: cada nombre abre su archivo. */
        linkCountries
        /* Un indice vacio en la portada es una franja que no se dibuja; acá es la
           pagina entera. Y `getCountryChapters` traga cualquier error de base en
           un `[]`, asi que sin esto un traspie de Postgres sirve una pagina en
           blanco entre una barra y un pie. */
        empty={
          <div className="doc-page">
            <h1>
              Nothing to show <i>yet.</i>
            </h1>
            <p className="doc-lead">
              The archive could not be read just now. Nothing is lost — try again in a
              moment.
            </p>
            <p className="doc-close">
              <Link className="text-link" href="/shop">
                Browse the work <span aria-hidden="true">↗</span>
              </Link>
            </p>
          </div>
        }
      />
    </div>
  );
}
