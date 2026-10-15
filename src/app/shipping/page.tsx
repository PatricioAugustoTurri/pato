import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { SHIPPING_RATES } from "@/lib/shipping";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shipping and Delivery",
  description:
    "Prints ship across Italy (€5, 2-5 working days) and the rest of the European Union (€10, 4-10 working days).",
  path: "/shipping",
});

/* Las tarifas y los plazos salen de `SHIPPING_RATES`, que es de donde el
   checkout arma sus `shipping_options`: la página no puede anunciar un número
   que Stripe no aplique, y si algún día cambia la tarifa, cambia en los dos
   lados a la vez. */
export default function ShippingPage() {
  return (
    <main className="doc-page is-dark-room">
      <h1>
        Shipping and <i>delivery.</i>
      </h1>
      <p className="doc-lead">
        Every print ships from Italy to anywhere in the European Union. There are two
        rates, and you pick one on Stripe&apos;s checkout page after entering the address
        the parcel goes to.
      </p>

      <section className="doc-section">
        <h2>What it costs, and how long</h2>
        <dl className="doc-rates">
          {SHIPPING_RATES.map(({ region, name, amount, minDays, maxDays }) => (
            <div key={region}>
              <dt>{name}</dt>
              <dd>
                {formatPrice(amount / 100)} <span>· {minDays}–{maxDays} working days</span>
              </dd>
            </div>
          ))}
        </dl>
        <p>
          Those days are the courier&apos;s transit time, counted from the moment the
          parcel leaves. Add the time it takes to prepare it, below.
        </p>
      </section>

      <section className="doc-section">
        <h2>Before it leaves</h2>
        <p>
          A print is prepared and dispatched within 2 to 5 working days of the payment
          going through. A large order, or one placed over a holiday, can sit at the
          longer end of that.
        </p>
      </section>

      <section className="doc-section">
        <h2>Where it goes</h2>
        <p>
          Checkout accepts addresses in the 27 countries of the European Union, and asks
          for a phone number because couriers ask for one. Outside the EU there is no
          shipping option yet — if you are elsewhere and want a print, write and we will
          see what can be done.
        </p>
      </section>

      <section className="doc-section">
        <h2>Following an order</h2>
        <p>
          Your orders live in{" "}
          <Link href="/account">your account</Link>: what you chose, what it cost, and the
          address it goes to. There is no automatic tracking email yet, so for anything
          about a parcel in transit, write to{" "}
          <a href="mailto:info@patoturri.com">info@patoturri.com</a> — the same person who
          took the photographs reads it.
        </p>
      </section>

      <p className="doc-close">
        <Link className="text-link" href="/returns">
          Returns and exchanges <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
