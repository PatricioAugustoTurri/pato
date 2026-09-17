import { Resend } from "resend";
import { formatPrice } from "@/lib/money";
import type { OrderEmailLine } from "@/lib/orders";
import { deliveryWindow } from "@/lib/shipping";

/**
 * Los dos mails que salen cuando Stripe confirma un cobro: la confirmación
 * para quien compró y el aviso de venta para quien tiene que imprimir.
 *
 * Viven acá y no dentro del webhook porque el webhook ya tiene un trabajo
 * delicado —marcar cobrado y bajar stock en una transacción— y mezclarle el
 * armado de dos mails lo vuelve ilegible.
 *
 * Los dos se dibujan con las mismas piezas (`shell`, `lineRows`, `moneyRows`)
 * y se diferencian en tres cosas: el idioma, el destinatario y qué bloques
 * llevan. Que compartan el armado es lo que evita que dentro de un año el
 * comprador reciba un recibo prolijo y el vendedor uno que quedó viejo.
 *
 * QUÉ NO VIAJA EN NINGUNO DE LOS DOS: datos de tarjeta —nunca los tenemos, los
 * toca Stripe y no nosotros—, ids internos que no sean el número de pedido, ni
 * nada de otros compradores. En el del comprador tampoco va ningún enlace al
 * panel. Los datos de contacto y la dirección SÍ van en el del vendedor: sin
 * eso no se puede despachar un paquete, que es para lo que existe ese mail.
 */

/** La dirección tal como la entrega Stripe. Se declara la forma mínima que se
    usa acá en vez de importar el tipo de Stripe: esta librería arma mails y no
    tiene por qué saber de dónde salió el dato. */
export type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

type OrderBase = {
  orderId: number;
  placedAt: Date;
  lines: OrderEmailLine[];
  shippingOption: string | null;
  shippingAmountCents: number | null;
  totalCents: number | null;
  shippingAddress: ShippingAddress | null;
};

export type OrderConfirmation = OrderBase & {
  to: string;
  customerName: string | null;
};

export type OrderAlert = OrderBase & {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
};

/* --- La paleta del sitio, escrita a mano ---------------------------------
   Un mail no puede cargar una hoja de estilos ni una variable CSS: cada color
   viaja pegado al elemento. Son los mismos valores que `globals.css`, y el
   mismo criterio de DESIGN.md —tinta y papel, filete de un píxel, cero radio—,
   porque el recibo es la última pantalla de la compra y tiene que parecerse a
   las anteriores. */
const INK = "#25231f";
const PAPER = "#f4f1eb";
const MUTED = "#6f675d";
const LINE = "#d9d3c9";
const ACCENT = "#a85527";

/* Las tipografías son de sistema a propósito: una fuente web en un mail se
   descarga en pocos clientes y en el resto cae en una sustitución que no
   elegimos. Mejor una pila que se ve bien en todos. */
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Los céntimos que cobra Stripe, en la misma forma que muestra el sitio. */
const euros = (cents: number) => formatPrice(cents / 100);

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Las líneas de una dirección, sin las que vengan vacías. */
function addressLines(address: ShippingAddress | null): string[] {
  if (!address) {
    return [];
  }

  const cityLine = [address.postal_code, address.city].filter(Boolean).join(" ");

  return [address.line1, address.line2, cityLine, address.state, address.country].filter(
    (line): line is string => Boolean(line && line.trim()),
  );
}

/**
 * La cáscara del mail: ancho fijo, fondo papel, y una regla de oro de los
 * clientes de correo —tablas y estilos pegados, nada de flex ni clases—.
 */
function shell(inner: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};margin:0;padding:24px 12px">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${PAPER};font-family:${SANS};color:${INK};line-height:1.55">
        ${inner}
      </table>
    </td>
  </tr>
</table>`;
}

/** El wordmark, en texto. Una imagen de logo la bloquean la mitad de los
    clientes y el mail abriría con un hueco. */
function masthead(): string {
  return `
  <tr><td style="padding:0 0 22px">
    <span style="font-size:17px;font-weight:600;letter-spacing:-.01em">Pato&nbsp;Turri</span>
    <span style="color:${MUTED};font-size:17px;font-style:italic">·</span>
    <span style="color:${MUTED};font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase">Travel photography prints</span>
  </td></tr>`;
}

/** El encabezado del recibo: qué es este mail y de qué pedido habla. */
function heading(title: string, orderId: number, dateLabel: string, date: string): string {
  return `
  <tr><td style="border-top:1px solid ${LINE};padding:22px 0 0">
    <h1 style="font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 10px">${escape(title)}</h1>
    <p style="color:${MUTED};font-family:${MONO};font-size:11px;letter-spacing:.06em;margin:0;text-transform:uppercase">
      #${orderId} &nbsp;·&nbsp; ${escape(dateLabel)} ${escape(date)}
    </p>
  </td></tr>`;
}

/**
 * Una obra por fila: miniatura, título, descripción, medida y precio.
 *
 * La miniatura va con `width` y `height` como ATRIBUTOS además de en el estilo,
 * porque varios clientes ignoran el CSS de una imagen y sin eso se dibuja a
 * tamaño original y rompe la tabla. Y toda imagen lleva `alt` con el título:
 * Gmail y Outlook bloquean imágenes por defecto, así que la primera vez que se
 * abre el mail lo que se lee es el texto alternativo.
 */
function lineRows(lines: OrderEmailLine[], eachLabel: string): string {
  return lines
    .map((line) => {
      const title = line.href
        ? `<a href="${escape(line.href)}" style="color:${INK};text-decoration:none">${escape(line.title)}</a>`
        : escape(line.title);

      const spec = [line.size, line.dimensions].filter(Boolean).join(" · ");

      return `
  <tr><td style="border-top:1px solid ${LINE};padding:18px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="84" valign="top" style="width:84px;padding-right:16px">
          ${
            line.imageUrl
              ? `<img src="${escape(line.imageUrl)}" alt="${escape(line.alt)}" width="80" height="80" style="width:80px;height:80px;object-fit:contain;display:block;background:${LINE}">`
              : `<div style="width:80px;height:80px;background:${LINE}"></div>`
          }
        </td>
        <td valign="top">
          <div style="font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:4px">${title}</div>
          ${
            line.description
              ? `<div style="color:${MUTED};font-size:13px;margin-bottom:7px">${escape(line.description)}</div>`
              : ""
          }
          <div style="color:${MUTED};font-family:${MONO};font-size:11px;letter-spacing:.04em">
            ${escape(spec)}${line.quantity > 1 ? ` &nbsp;·&nbsp; ${line.quantity} ${escape(eachLabel)}` : ""}
          </div>
        </td>
        <td valign="top" align="right" style="font-family:${MONO};font-size:13px;white-space:nowrap">
          ${euros(line.lineCents)}
        </td>
      </tr>
    </table>
  </td></tr>`;
    })
    .join("");
}

/** Envío y total, en filas regladas y con las cifras en mono y alineadas. */
function moneyRows(order: OrderBase, shippingLabel: string, totalLabel: string): string {
  const shipping =
    order.shippingAmountCents !== null
      ? `
      <tr>
        <td style="color:${MUTED};font-size:13px;padding:4px 0">${escape(order.shippingOption ?? shippingLabel)}</td>
        <td align="right" style="color:${MUTED};font-family:${MONO};font-size:13px;padding:4px 0">${euros(order.shippingAmountCents)}</td>
      </tr>`
      : "";

  const total =
    order.totalCents !== null
      ? `
      <tr>
        <td style="font-size:15px;font-weight:600;padding:10px 0 0">${escape(totalLabel)}</td>
        <td align="right" style="font-family:${MONO};font-size:15px;font-weight:600;padding:10px 0 0">${euros(order.totalCents)}</td>
      </tr>`
      : "";

  return `
  <tr><td style="border-top:1px solid ${LINE};padding:14px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${shipping}${total}</table>
  </td></tr>`;
}

/** Un bloque con rótulo mono arriba y líneas debajo. */
function block(label: string, body: string): string {
  return `
  <tr><td style="border-top:1px solid ${LINE};padding:18px 0">
    <p style="color:${MUTED};font-family:${MONO};font-size:10px;letter-spacing:.12em;margin:0 0 7px;text-transform:uppercase">${escape(label)}</p>
    <div style="font-size:14px">${body}</div>
  </td></tr>`;
}

/** La misma información en texto plano. No es un respaldo por si acaso: hay
    quien lee el correo en texto, y un mail sin parte de texto puntúa peor en
    los filtros de spam. */
function plainLines(lines: OrderEmailLine[], eachLabel: string): string {
  return lines
    .map((line) => {
      const spec = [line.size, line.dimensions].filter(Boolean).join(" · ");
      const count = line.quantity > 1 ? ` — ${line.quantity} ${eachLabel}` : "";
      return `  ${line.title}\n    ${spec}${count}    ${euros(line.lineCents)}`;
    })
    .join("\n");
}

/** Une descartando lo que no va, pero conservando las líneas en blanco que sí.
    `null` es una línea que no corresponde; `""` es aire a propósito. */
const joinLines = (lines: (string | null)[]) =>
  lines.filter((line): line is string => line !== null).join("\n");

async function deliver(
  message: { from: string; to: string; replyTo?: string; subject: string; text: string; html: string },
  tag: string,
  orderId: number,
): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string);
    const { error } = await resend.emails.send(message);

    if (error) {
      console.error(`[${tag}] pedido ${orderId}:`, error);
    }
  } catch (error) {
    console.error(`[${tag}] pedido ${orderId}:`, error);
  }
}

/**
 * La confirmación que recibe quien compra, en inglés como el resto del sitio.
 *
 * Hasta acá la única confirmación era la pantalla de éxito: si el comprador la
 * cerraba, no le quedaba constancia de nada. Un pedido de fotografía tarda días
 * en imprimirse y enviarse, y en ese hueco lo normal es dudar de si la compra
 * entró.
 *
 * Por eso lleva la obra dibujada y no solo nombrada, la fecha estimada de
 * entrega en fechas y no en "días hábiles" —que obliga a contar con un
 * calendario al lado—, y la dirección a la que va el paquete, que es lo único
 * que el comprador todavía puede corregir a tiempo si se equivocó.
 *
 * No lanza nunca: la llama el webhook, y un pedido cobrado y con el stock ya
 * descontado no se puede dar por fallido porque el proveedor de mail esté
 * caído. Si algo sale mal queda en el log del servidor.
 */
export async function sendOrderConfirmation(order: OrderConfirmation): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  /* El remitente es una direccion del dominio que nadie lee: se verifico en
     Resend para poder enviar, pero no hay casilla detras. Y esta confirmacion,
     a diferencia del formulario de contacto, va al cliente: si responde —por el
     envio, porque puso mal la direccion, porque quiere agregar una copia— le
     esta escribiendo al unico lugar que le ofrecimos. Sin esto ese mail se
     pierde sin rebote y sin aviso, y del otro lado parece que nadie contesta. */
  const replyTo = process.env.CONTACT_TO_EMAIL;

  if (!apiKey) {
    console.error(`[order-email] pedido ${order.orderId}: falta RESEND_API_KEY`);
    return;
  }

  const greeting = order.customerName ? `Hi ${order.customerName},` : "Hi,";
  const placed = formatDate(order.placedAt, "en-GB");
  const window = deliveryWindow(order.shippingOption, order.placedAt);
  const estimate = window
    ? `${formatDate(window.min, "en-GB")} – ${formatDate(window.max, "en-GB")}`
    : null;
  const address = addressLines(order.shippingAddress);
  const prints = order.lines.reduce((total, line) => total + line.quantity, 0);

  const text = joinLines([
    greeting,
    "",
    "Thank you for your order. Your prints are being prepared.",
    "",
    `Order #${order.orderId} — placed ${placed}`,
    "",
    plainLines(order.lines, "prints"),
    "",
    order.shippingAmountCents !== null
      ? `  ${order.shippingOption ?? "Shipping"}    ${euros(order.shippingAmountCents)}`
      : null,
    order.totalCents !== null ? `  Total    ${euros(order.totalCents)}` : null,
    "",
    estimate ? `Estimated delivery: ${estimate}` : null,
    estimate ? "" : null,
    address.length > 0 ? "Shipping to:" : null,
    address.length > 0 ? address.map((line) => `  ${line}`).join("\n") : null,
    address.length > 0 ? "" : null,
    "If anything is wrong, reply to this email and it reaches us directly.",
    "",
    "Pato Turri",
    "patoturri.com",
  ]);

  const html = shell(`
  ${masthead()}
  ${heading(prints === 1 ? "Your print is on its way" : "Your prints are on their way", order.orderId, "Placed", placed)}
  <tr><td style="padding:16px 0 4px;font-size:15px">
    <p style="margin:0 0 10px">${escape(greeting)}</p>
    <p style="margin:0">Thank you for your order. Everything below is being prepared and printed by hand.</p>
  </td></tr>
  ${lineRows(order.lines, "prints")}
  ${moneyRows(order, "Shipping", "Total")}
  ${
    estimate
      ? block(
          "Estimated delivery",
          `<span style="font-family:${MONO};font-size:13px">${escape(estimate)}</span>
           <div style="color:${MUTED};font-size:13px;margin-top:5px">Business days, weekends excluded. We will write again when the parcel is on its way.</div>`,
        )
      : ""
  }
  ${address.length > 0 ? block("Shipping to", address.map(escape).join("<br>")) : ""}
  <tr><td style="border-top:1px solid ${LINE};padding:18px 0 0">
    <p style="color:${MUTED};font-size:13px;margin:0 0 6px">
      If anything here is wrong, reply to this email — it reaches us directly.
    </p>
    <p style="margin:0;font-size:13px">
      <a href="https://patoturri.com" style="color:${ACCENT};text-decoration:none">patoturri.com</a>
    </p>
  </td></tr>`);

  await deliver(
    {
      from: `Pato Turri <${from}>`,
      to: order.to,
      /* Se omite la clave entera si no hay a donde responder, en vez de
         mandarla en `undefined` y confiar en que el SDK la descarte. */
      ...(replyTo ? { replyTo } : {}),
      subject: `Your order #${order.orderId} — Pato Turri`,
      text,
      html,
    },
    "order-email",
    order.orderId,
  );
}

/**
 * El aviso de venta, para el fotógrafo.
 *
 * Antes una compra no le avisaba a nadie: el comprador recibía su confirmación
 * y de este lado la venta solo existía si alguien entraba a /admin/orders a
 * mirar. Un pedido que hay que imprimir y despachar no puede depender de que se
 * le ocurra a alguien revisar una pantalla.
 *
 * Va en castellano y no en inglés como el del comprador: este mail no es del
 * sitio, es del taller. Lo lee una sola persona, la misma que usa el panel.
 *
 * Lleva TODO lo necesario para trabajar el pedido sin volver al panel: qué
 * obras, en qué tamaño, cuántas copias, a qué dirección y para cuándo está
 * prometido. Los datos de contacto del comprador van justamente porque son
 * necesarios para despachar; lo que no viaja es todo lo demás.
 */
export async function sendOrderAlert(order: OrderAlert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    console.error(
      `[order-alert] pedido ${order.orderId}: falta ${!apiKey ? "RESEND_API_KEY" : "CONTACT_TO_EMAIL"}`,
    );
    return;
  }

  const copies = order.lines.reduce((total, line) => total + line.quantity, 0);
  const total = order.totalCents !== null ? euros(order.totalCents) : "—";
  const placed = formatDate(order.placedAt, "es-AR");
  const window = deliveryWindow(order.shippingOption, order.placedAt);
  const promised = window ? `${formatDate(window.min, "es-AR")} – ${formatDate(window.max, "es-AR")}` : null;
  const address = addressLines(order.shippingAddress);

  /* El asunto es lo único que se lee en la notificación del teléfono, así que
     dice lo que hay que saber sin abrir: cuántas copias y por cuánto. */
  const subject = `Venta: ${copies} ${copies === 1 ? "copia" : "copias"} · ${total} · pedido #${order.orderId}`;

  const text = joinLines([
    `Pedido #${order.orderId} — ${placed}`,
    "",
    "A imprimir:",
    plainLines(order.lines, "copias"),
    "",
    order.shippingAmountCents !== null
      ? `  ${order.shippingOption ?? "Envío"}    ${euros(order.shippingAmountCents)}`
      : null,
    `  Total cobrado    ${total}`,
    "",
    promised ? `Prometido para: ${promised}` : null,
    promised ? "" : null,
    "Comprador:",
    `  ${order.customerName ?? "Sin nombre"}`,
    `  ${order.customerEmail ?? "Sin email"}`,
    order.customerPhone ? `  ${order.customerPhone}` : null,
    "",
    "Enviar a:",
    address.length > 0 ? address.map((line) => `  ${line}`).join("\n") : "  Sin dirección",
    "",
    "El pedido también está en patoturri.com/admin/orders",
  ]);

  const html = shell(`
  ${masthead()}
  ${heading(`${copies} ${copies === 1 ? "copia vendida" : "copias vendidas"} · ${total}`, order.orderId, "Cobrado el", placed)}
  ${lineRows(order.lines, "copias")}
  ${moneyRows(order, "Envío", "Total cobrado")}
  ${
    promised
      ? block(
          "Prometido para",
          `<span style="font-family:${MONO};font-size:13px">${escape(promised)}</span>
           <div style="color:${MUTED};font-size:13px;margin-top:5px">Días hábiles desde hoy, según la tarifa que eligió.</div>`,
        )
      : ""
  }
  ${block(
    "Comprador",
    joinLines([
      escape(order.customerName ?? "Sin nombre"),
      order.customerEmail
        ? `<a href="mailto:${escape(order.customerEmail)}" style="color:${ACCENT};text-decoration:none">${escape(order.customerEmail)}</a>`
        : "Sin email",
      order.customerPhone ? escape(order.customerPhone) : null,
    ]).replace(/\n/g, "<br>"),
  )}
  ${block("Enviar a", address.length > 0 ? address.map(escape).join("<br>") : "Sin dirección")}
  <tr><td style="border-top:1px solid ${LINE};padding:18px 0 0">
    <p style="color:${MUTED};font-size:13px;margin:0">
      Respondiendo a este mail le escribís al comprador.
      El pedido también está en
      <a href="https://patoturri.com/admin/orders" style="color:${ACCENT};text-decoration:none">/admin/orders</a>.
    </p>
  </td></tr>`);

  await deliver(
    {
      from: `Tienda Pato Turri <${from}>`,
      to,
      /* Responder a este mail le escribe al comprador, que es lo que se quiere
         hacer cuando algo del pedido no cierra. */
      ...(order.customerEmail ? { replyTo: order.customerEmail } : {}),
      subject,
      text,
      html,
    },
    "order-alert",
    order.orderId,
  );
}
