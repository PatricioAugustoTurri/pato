import { Fragment } from "react";
import Link from "next/link";
import { getCollections } from "@/lib/collections";

export const metadata = {
  title: "Not found",
  robots: { index: false, follow: true },
};

/* La misma cáscara de mensaje que el carrito vacío, las dos vueltas de Stripe
   y el error: una sola forma para todo lo que no es una sala con obra. Lo
   propio de esta pantalla es la salida. Una dirección rota casi siempre es un
   enlace viejo a una obra, así que en vez de mandar a la portada se ofrecen
   las colecciones, que es donde la obra sigue colgada. */
export default async function NotFound() {
  const collections = (await getCollections()) ?? [];

  return (
    <main className="cart-room is-empty is-dark-room">
      <div className="cart-note">
        <h1>
          Nothing hangs <i>here.</i>
        </h1>
        <p>
          The address may have a typo, or the work it pointed to has moved.
          {collections.length > 0 && (
            <>
              {" "}Everything in the archive is in one of its collections:{" "}
              {collections.map((collection, index) => (
                <Fragment key={collection.id}>
                  {index > 0 && (index === collections.length - 1 ? " and " : ", ")}
                  <Link href={`/shop/${collection.slug}`}>{collection.name}</Link>
                </Fragment>
              ))}
              .
            </>
          )}
        </p>
        <Link href="/shop" className="text-link">
          Go to the shop <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
