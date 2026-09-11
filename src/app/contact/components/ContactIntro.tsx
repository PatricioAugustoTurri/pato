import { SHIPPING_RATES, type ShippingRegion } from "@/lib/shipping";

const EMAIL = "hola@patoturri.com";

/* Esta página todavía está en castellano y `SHIPPING_RATES.name` está en
   inglés, porque ese campo es el que Stripe muestra en su página de pago. Acá
   se nombra el destino en el idioma de la página; la tarifa y los plazos, que
   son lo que no puede quedar viejo, se siguen leyendo del dato. */
const DESTINO: Record<ShippingRegion, string> = {
  it: "Envío en Italia",
  eu: "Envío al resto de la Unión Europea",
};

export default function ContactIntro() {
  return (
    <div className="contact-intro">
      <h1>Escribime.<br /><i>Contesto yo.</i></h1>
      {/* Sin plural mayestático: no hay equipo de atención, y decir "te leemos"
          en una tienda de un solo autor es la primera cosa que suena falsa. */}
      <p className="contact-description">
        Una duda sobre un pedido, una pregunta sobre una copia o algo que quieras
        contarme. Acá no hay equipo de atención: lee y responde la misma persona
        que sacó las fotografías.
      </p>

      <a className="contact-email" href={`mailto:${EMAIL}`}>
        <span>Email directo</span>
        <strong>{EMAIL}</strong>
      </a>

      {/* Las dos preguntas que más se escriben, respondidas antes de escribir.
          Las cifras salen de `SHIPPING_RATES`, que es lo que cobra el checkout:
          la página no puede prometer una tarifa que Stripe no aplique. */}
      <dl className="contact-facts">
        {SHIPPING_RATES.map(({ region, amount, minDays, maxDays }) => (
          <div key={region}>
            <dt>{DESTINO[region]}</dt>
            <dd>
              {(amount / 100).toFixed(2)} EUR
              <span> · {minDays}-{maxDays} días hábiles</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
