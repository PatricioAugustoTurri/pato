import Link from "next/link";
import DestinationsSection from "@/components/DestinationsSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Destinations",
  description:
    "Every country in the archive — from Japan, Vietnam and Thailand to Spain, Morocco, Mexico and Argentina — with the work that came out of it.",
  path: "/destinations",
});

/* La misma hora que la portada, y por el mismo motivo: esta pagina dibuja el
   mismo `DestinationsSection` contra la misma base. Sin esto, marcar un pais
   en el panel movia la portada y dejaba el indice completo congelado en lo que
   hubiera al compilar, que es la contradiccion mas facil de no ver: la misma
   seccion diciendo dos cosas distintas en dos direcciones. */
export const revalidate = 3600;

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
        /* Y si vino a elegir, el orden del autor le estorba: son diecisiete
           nombres y el que busca «Japan» tiene que leerlos todos. Alfabético
           por el nombre en inglés, que es el que está impreso acá. La portada
           se queda con el orden curado; es la única diferencia de forma entre
           las dos, y está escrita en los dos lados a propósito. */
        order="alphabetical"
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
