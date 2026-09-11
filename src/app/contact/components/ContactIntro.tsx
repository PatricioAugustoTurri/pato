import { SHIPPING_RATES } from "@/lib/shipping";

const EMAIL = "hola@patoturri.com";

export default function ContactIntro() {
  return (
    <div className="contact-intro">
      <h1>Write to me.<br /><i>I answer.</i></h1>
      {/* Sin plural mayestático: no hay equipo de atención, y decir "te leemos"
          en una tienda de un solo autor es la primera cosa que suena falsa. */}
      <p className="contact-description">
        A question about an order, a question about a print, or anything you feel
        like telling me. There is no support team here: the same person who took
        the photographs reads and answers.
      </p>

      <a className="contact-email" href={`mailto:${EMAIL}`}>
        <span>Direct email</span>
        <strong>{EMAIL}</strong>
      </a>

      {/* Las dos preguntas que más se escriben, respondidas antes de escribir.
          Las cifras salen de `SHIPPING_RATES`, que es lo que cobra el checkout:
          la página no puede prometer una tarifa que Stripe no aplique. */}
      <dl className="contact-facts">
        {SHIPPING_RATES.map(({ region, name, amount, minDays, maxDays }) => (
          <div key={region}>
            <dt>{name}</dt>
            <dd>
              {(amount / 100).toFixed(2)} EUR
              <span> · {minDays}-{maxDays} working days</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
