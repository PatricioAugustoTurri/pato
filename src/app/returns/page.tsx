import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Returns and Exchanges",
  description:
    "Fourteen days to change your mind, and what to do if a print arrives damaged.",
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <main className="doc-page is-dark-room">
      <h1>
        Returns and <i>exchanges.</i>
      </h1>
      <p className="doc-lead">
        A photograph on a screen is not the same as a photograph on paper. If the one that
        arrives is not the one you wanted, you have fourteen days.
      </p>

      <section className="doc-section">
        <h2>Fourteen days to change your mind</h2>
        <p>
          You can return a print within 14 days of receiving it, for any reason, without
          explaining yourself. That is the right EU law gives you on anything bought at a
          distance, and it applies here.
        </p>
        <p>
          Write to <a href="mailto:info@patoturri.com">info@patoturri.com</a> first so we
          agree on where it goes. Send it back the way it reached you — flat, protected,
          in the same condition — because a print that arrives creased cannot be sold to
          anyone else.
        </p>
      </section>

      <section className="doc-section">
        <h2>Who pays for what</h2>
        <p>
          The print is refunded in full to the card it was paid with. Return postage is
          yours: choose the courier you trust, and keep the receipt until the refund
          lands.
        </p>
      </section>

      <section className="doc-section">
        <h2>If it arrives damaged</h2>
        <p>
          That is not a return, and you should not pay to send it back. Write with a
          photograph of the print and of the packaging it came in, and we sort it out
          between us.
        </p>
      </section>

      <section className="doc-section">
        <h2>Swapping a size</h2>
        <p>
          There is no separate exchange: a swap is a return and a new order. Send the
          print back within the fourteen days and order the size you want — the two
          things do not have to wait for each other.
        </p>
      </section>

      <p className="doc-close">
        <Link className="text-link" href="/shipping">
          Shipping and delivery <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
