import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { MAX_PER_LINE } from "@/lib/cart-limits";
import { formatPrice } from "@/lib/money";
import { SHIPPING_RATES } from "@/lib/shipping";
import { SELLER } from "@/lib/seller";

export const metadata = pageMetadata({
  title: "Terms of Sale",
  description:
    "Who sells the prints, what you are buying, how payment works, shipping rates and times across the EU, and your 14 days to return a print.",
  path: "/terms",
});

/* Las condiciones dicen lo que la tienda ya hace, comprobado contra el código:
   el contrato nace cuando Stripe confirma el cobro, el tope de copias es el de
   `cart-limits` y las tarifas y plazos salen de `SHIPPING_RATES`, que es de
   donde el checkout arma sus opciones de envío. Desde 2026-11-01 los envíos y
   las devoluciones viven acá, con el mismo texto que tenían /shipping y
   /returns: la tienda quedó solo como tienda y esto es lo que la ley pide
   mostrar antes de pagar. Lo que no está confirmado —papel, laboratorio— no se
   menciona. */
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

      <section className="doc-section" id="delivery">
        <h2>Delivery</h2>
        <p>
          Every print ships from Italy to anywhere in the European Union. There are two
          rates, and you pick one on Stripe&apos;s checkout page after entering the address
          the parcel goes to.
        </p>
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
          parcel leaves. Before that, a print is prepared and dispatched within 2 to 5
          working days of the payment going through; a large order, or one placed over a
          holiday, can sit at the longer end of that.
        </p>
        <p>
          Checkout accepts addresses in the 27 countries of the European Union, and asks
          for a phone number because couriers ask for one. Outside the EU there is no
          shipping option yet — if you are elsewhere and want a print, write and we will
          see what can be done.
        </p>
        <p>
          Your orders live in <Link href="/account">your account</Link>, if you have one.
          There is no automatic tracking email yet, so for anything about a parcel in
          transit, write to <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>. The
          print is yours to look after from the moment it is delivered to the address you
          gave.
        </p>
      </section>

      <section className="doc-section" id="returns">
        <h2>Changing your mind</h2>
        <p>
          You can return a print within 14 days of receiving it, for any reason, without
          explaining yourself. That is the right EU law gives you on anything bought at a
          distance, and it applies here.
        </p>
        <p>
          Write to <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> first so we agree
          on where it goes. Send it back the way it reached you — flat, protected, in the
          same condition — because a print that arrives creased cannot be sold to anyone
          else.
        </p>
        <p>
          The print is refunded in full to the card it was paid with. Return postage is
          yours: choose the courier you trust, and keep the receipt until the refund lands.
        </p>
        <p>
          There is no separate exchange: a swap is a return and a new order. Send the print
          back within the fourteen days and order the size you want — the two things do
          not have to wait for each other.
        </p>
      </section>

      <section className="doc-section" id="damaged">
        <h2>If it arrives damaged</h2>
        <p>
          That is not a return, and you should not pay to send it back. Write with a
          photograph of the print and of the packaging it came in, and we sort it out
          between us.
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

      <p className="doc-updated">Last updated 1 November 2026</p>

      <p className="doc-close">
        <Link className="text-link" href="/shop">
          Back to the shop <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
