import Link from "next/link";

export const metadata = {
  title: "Pato Turri | Privacy",
  description: "What this shop collects, why, who else sees it, and how to get it deleted.",
};

/* Esta página describe lo que el código hace de verdad, comprobado contra él:
   no hay analítica, no hay rastreadores, las tipografías se auto-alojan y el
   carrito no sale del navegador hasta el checkout. Cada afirmación de acá se
   puede verificar leyendo el repositorio, que es la única forma honesta de
   escribir una página así. */
export default function PrivacyPage() {
  return (
    <main className="doc-page is-dark-room">
      <h1>
        Privacy<i>.</i>
      </h1>
      <p className="doc-lead">
        This is a one-person shop, and this page says exactly what happens to the data
        that passes through it. Everything here can be checked against the site itself.
      </p>

      <section className="doc-section">
        <h2>Who is responsible</h2>
        <p>
          Pato Turri. For anything on this page — a question, a correction, a request to
          delete something — the address is{" "}
          <a href="mailto:hola@patoturri.com">hola@patoturri.com</a>, and the person who
          reads it is the same one who took the photographs.
        </p>
      </section>

      <section className="doc-section">
        <h2>What this site never does</h2>
        <p>
          There is no analytics, no tracking pixel, no advertising cookie and no third
          party watching you browse. Nobody is profiled and nothing is sold to anyone.
        </p>
        <p>
          The typefaces are served from this site, not requested from Google, so simply
          reading a page tells no outside company that you were here. Your cart lives only
          in your own browser until the moment you check out. And card details never reach
          this site at all — the payment happens on Stripe&apos;s own page.
        </p>
      </section>

      <section className="doc-section">
        <h2>What is collected, and why</h2>
        <p>
          <strong>If you open an account:</strong> your name, your email and your password,
          which is stored scrambled so that it cannot be read back — not by me either. This
          is what lets you sign in and check out.
        </p>
        <p>
          <strong>If you order a print:</strong> what you ordered and what it cost, plus
          the name, email, phone number and shipping address you give Stripe at checkout.
          Without those the parcel has nowhere to go.
        </p>
        <p>
          <strong>If you write through the contact form:</strong> your name, email, subject
          and message, which arrive in my inbox as an email. Nothing is stored on the site.
        </p>
        <p>
          <strong>If you sign up for the travel letter:</strong> your email address, and
          nothing else.
        </p>
      </section>

      <section className="doc-section">
        <h2>Who else sees it</h2>
        <p>
          <strong>Stripe</strong> handles the payment and collects the shipping address.{" "}
          <strong>Resend</strong> delivers the contact emails and holds the travel-letter
          list. <strong>Cloudinary</strong> serves the photographs themselves and receives
          no personal data. The database that holds accounts and orders is operated for
          this shop alone and is not shared with anyone.
        </p>
        <p>
          Stripe and Resend are United States companies, so data handled by them may be
          processed outside the European Union under the safeguards their own agreements
          provide. Beyond those three, nothing is passed on to anyone.
        </p>
      </section>

      <section className="doc-section">
        <h2>Cookies</h2>
        <p>
          One, and only if you sign in: the cookie that keeps you signed in. It is not used
          to follow you anywhere and there is nothing to consent to, because there is
          nothing else being set.
        </p>
      </section>

      <section className="doc-section">
        <h2>How long it is kept</h2>
        <p>
          Accounts and orders are kept for as long as the shop exists. There is no
          automatic deletion: an order is a record of a sale and stays. If you want your
          account and its data removed, write and I remove them by hand. A travel-letter
          address is removed as soon as you unsubscribe.
        </p>
      </section>

      <section className="doc-section">
        <h2>What you can ask for</h2>
        <p>
          A copy of everything held about you, a correction, a deletion, or that a use
          stops. All of it goes to the same address, and none of it needs a reason. If an
          answer does not satisfy you, you can complain to the data protection authority of
          the country you live in.
        </p>
      </section>

      <p className="doc-updated">Last updated 11 September 2026</p>

      <p className="doc-close">
        <Link className="text-link" href="/shop">
          Browse the work <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </main>
  );
}
