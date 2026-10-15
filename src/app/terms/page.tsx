import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { MAX_PER_LINE } from "@/lib/cart-limits";
import { SELLER } from "@/lib/seller";

export const metadata = pageMetadata({
  title: "Terms of Sale",
  description:
    "Who sells the prints, what you are buying, how payment and delivery work, and your right to change your mind.",
  path: "/terms",
});

/* Las condiciones dicen lo que la tienda ya hace, comprobado contra el código
   y contra las otras páginas de ayuda: el contrato nace cuando Stripe confirma
   el cobro, el tope de copias es el de `cart-limits`, los plazos de envío y la
   devolución viven en /shipping y /returns y acá solo se enlazan, para que no
   haya dos versiones de la misma regla. Lo que no está confirmado —papel,
   laboratorio— no se menciona. */
export default function TermsPage() {
  return (
    <main className="doc-page is-dark-room">
      <h1>
        Terms of <i>sale.</i>
      </h1>
      <p className="doc-lead">
        What you agree to when you order a print here, written to be read. The short
        version: you pay on Stripe, the print is made for you, and you have fourteen
        days to change your mind once it arrives.
      </p>

      <section className="doc-section">
        <h2>Who sells</h2>
        <p>
          The prints are sold by {SELLER.name}, {SELLER.status}. {SELLER.taxNote} For
          anything about an order, write to{" "}
          <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>.
        </p>
      </section>

      <section className="doc-section">
        <h2>What you are buying</h2>
        <p>
          A print of a photograph by Pato Turri, in the size you choose, printed when you
          order it — nothing is printed in advance. The photograph on screen is shown as
          faithfully as a screen allows; colours on paper can differ slightly from a
          given display.
        </p>
        <p>
          The print is yours. The photograph is not: copyright stays with the author, so
          buying a print does not give the right to copy, scan, publish or sell the image.
        </p>
      </section>

      <section className="doc-section">
        <h2>Prices and payment</h2>
        <p>
          Prices are in euros and are the price you pay; shipping is added at checkout
          according to where the print goes. Payment is by card on Stripe&apos;s own
          page, so card details never reach this site.
        </p>
        <p>
          The order is placed when Stripe confirms the payment, and a confirmation with
          the order number goes to the email you gave at checkout. You do not need an
          account to order.
        </p>
        <p>
          An order can hold up to {MAX_PER_LINE} copies of the same photograph in the same
          size. If a price on the site is ever obviously wrong, the order is cancelled
          and refunded in full before anything is printed, and you are told why.
        </p>
      </section>

      <section className="doc-section">
        <h2>Delivery</h2>
        <p>
          Prints ship from Italy to Italy and the rest of the European Union. Rates and
          times are on <Link href="/shipping">shipping and delivery</Link>. The print is
          yours to look after from the moment it is delivered to the address you gave.
        </p>
      </section>

      <section className="doc-section">
        <h2>Changing your mind</h2>
        <p>
          You have 14 days from the day the print arrives to return it, for any reason.
          How to do it, who pays postage, and what happens if a print arrives damaged are
          on <Link href="/returns">returns and exchanges</Link>.
        </p>
      </section>

      <section className="doc-section">
        <h2>Your data</h2>
        <p>
          What is collected to fulfil an order, and who else sees it, is on the{" "}
          <Link href="/privacy">privacy</Link> page.
        </p>
      </section>

      <section className="doc-section">
        <h2>If something goes wrong</h2>
        <p>
          Write first: almost everything is settled in an email. These terms are governed
          by Italian law, without taking away any protection the law of the country you
          live in gives you as a consumer.
        </p>
      </section>

      <p className="doc-updated">Last updated 15 October 2026</p>

      <p className="doc-close">
        <Link className="text-link" href="/returns">
          Returns and exchanges <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
