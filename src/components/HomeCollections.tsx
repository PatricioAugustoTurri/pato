import Link from "next/link";
import CollectionWall from "@/components/CollectionWall";
import { getCollections } from "@/lib/collections";

/**
 * La primera franja después del hero: las colecciones.
 *
 * El catálogo se navega por colección (decisión del usuario, 2026-10-15), así
 * que la portada abre con esas puertas y no con el archivo por país, que baja
 * a franja secundaria. Es el mismo muro que /shop —mismos paneles, mismo
 * reparto de ancho por cantidad de obras— para que el clic desde acá no lleve
 * a una sala que se vea distinta de la puerta.
 */
export default async function HomeCollections() {
  const collections = await getCollections();

  /* Sin colecciones no hay franja: la portada no anuncia una tienda vacía. */
  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <section className="home-section home-collections" id="colecciones">
      <div className="home-roll-head home-collections-head">
        <h2>
          The <i>collections.</i>
        </h2>
        <Link className="text-link" href="/shop">
          Everything in the shop <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <CollectionWall categories={collections} />
    </section>
  );
}
