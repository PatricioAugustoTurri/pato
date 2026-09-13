import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { CATALOG_SIZES } from "@/lib/photo-variants";
import { getArchiveCounts } from "@/lib/photos";
import { sizeDimensions } from "@/lib/sizes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Print sizes and prices, shipping to Italy and the EU, delivery times and accounts — the things people ask before ordering.",
  path: "/faq",
});

/* Solo se responde lo que el sistema sostiene. Los precios salen de
   `CATALOG_SIZES`, que es la lista con la que el servidor arma las variantes de
   cada obra, y las cifras del archivo se cuentan contra la base. Nada sobre
   papel, laboratorio ni enmarcado: no está confirmado, y una pregunta frecuente
   respondida a ojo es peor que una pregunta ausente. */
export default async function FaqPage() {
  const counts = await getArchiveCounts();

  return (
    <main className="doc-page is-dark-room">
      <h1>
        Frequently asked <i>questions.</i>
      </h1>
      <p className="doc-lead">
        The things people write to ask before ordering. If yours is not here, it goes to{" "}
        <a href="mailto:info@patoturri.com">info@patoturri.com</a>.
      </p>

      <section className="doc-section">
        <h2>What sizes are there, and what do they cost?</h2>
        <dl className="doc-rates">
          {CATALOG_SIZES.map(({ size, price }) => (
            <div key={size}>
              <dt>
                {size} <span className="doc-unit">· {sizeDimensions(size)}</span>
              </dt>
              <dd>{formatPrice(price)}</dd>
            </div>
          ))}
        </dl>
        <p>Every photograph costs the same at the same size. There is no premium print.</p>
      </section>

      <section className="doc-section">
        <h2>Are the photographs yours?</h2>
        <p>
          All of them. There is nothing bought, nothing commissioned and nothing
          second-hand in the archive:{" "}
          {counts.obras > 0 && (
            <>
              {counts.obras} works from {counts.paises} countries, grouped into{" "}
              {counts.colecciones} collections,{" "}
            </>
          )}
          every one taken on the road. You can read how that happened in{" "}
          <Link href="/about">the story</Link>.
        </p>
      </section>

      <section className="doc-section">
        <h2>Where do you ship, and how long does it take?</h2>
        <p>
          Anywhere in the European Union, from Italy. There are two rates and you pick
          one at checkout; a print is prepared within 2 to 5 working days and then
          travels. The exact figures are on{" "}
          <Link href="/shipping">shipping and delivery</Link>.
        </p>
      </section>

      <section className="doc-section">
        <h2>Do I need an account to order?</h2>
        <p>
          Yes. Checkout asks you to sign in first, because an order has to belong to
          someone — that is how it ends up in{" "}
          <Link href="/account">your orders</Link>, with what you chose and where it went.
          Creating the account is one field more than signing in.
        </p>
      </section>

      <section className="doc-section">
        <h2>Can I return a print?</h2>
        <p>
          Within 14 days of receiving it, for any reason. Return postage is yours; the
          print is refunded in full. The details are on{" "}
          <Link href="/returns">returns and exchanges</Link>.
        </p>
      </section>

      <section className="doc-section">
        <h2>How is the payment handled?</h2>
        <p>
          Through Stripe. The card never touches this site: the checkout happens on
          Stripe&apos;s own page, and the price is recalculated on the server before you
          get there, so what you pay is what the catalogue says.
        </p>
      </section>

      <p className="doc-close">
        <Link className="text-link" href="/shop">
          Browse the work <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
