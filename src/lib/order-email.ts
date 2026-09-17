import { Resend } from "resend";
import { formatPrice } from "@/lib/money";

/**
 * El mail que recibe quien compra, cuando Stripe confirma el cobro.
 *
 * Hasta ahora la única confirmación era la pantalla de éxito: si el comprador
 * la cerraba, no le quedaba constancia de nada. Un pedido de fotografía tarda
 * días en imprimirse y enviarse, y en ese hueco lo normal es dudar de si la
 * compra entró.
 *
 * Vive acá y no dentro del webhook porque el webhook ya tiene un trabajo
 * delicado —marcar cobrado y bajar stock en una transacción— y mezclarle el
 * armado de un mail lo vuelve ilegible.
 */

export type OrderEmailItem = {
  name: string;
  size: string;
  quantity: number;
  unitAmountCents: number;
};

export type OrderConfirmation = {
  orderId: number;
  to: string;
  customerName: string | null;
  items: OrderEmailItem[];
  shippingOption: string | null;
  shippingAmountCents: number | null;
  totalCents: number | null;
};

/** Los céntimos que cobra Stripe, en la misma forma que muestra el sitio. */
const euros = (cents: number) => formatPrice(cents / 100);

function itemLines(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) =>
        `  ${item.quantity} x ${item.name} (${item.size})   ${euros(item.unitAmountCents * item.quantity)}`,
    )
    .join("\n");
}

function itemRows(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">
            ${item.quantity} &times; ${item.name}
            <span style="color:#777">(${item.size})</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">
            ${euros(item.unitAmountCents * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");
}

/**
 * Manda la confirmación. No lanza nunca: la llama el webhook, y un pedido
 * cobrado y con el stock ya descontado no se puede dar por fallido porque el
 * proveedor de mail esté caído. Si algo sale mal queda en el log del servidor.
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
  const shipping =
    order.shippingAmountCents !== null
      ? `${order.shippingOption ?? "Shipping"}: ${euros(order.shippingAmountCents)}`
      : null;
  const total = order.totalCents !== null ? euros(order.totalCents) : null;

  const text = [
    greeting,
    "",
    "Thank you for your order. Your prints are being prepared.",
    "",
    `Order #${order.orderId}`,
    "",
    itemLines(order.items),
    shipping ? `\n  ${shipping}` : "",
    total ? `\n  Total: ${total}` : "",
    "",
    "You will hear from us again when the parcel is on its way.",
    "",
    "Pato Turri",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#111;line-height:1.5">
      <p>${greeting}</p>
      <p>Thank you for your order. Your prints are being prepared.</p>
      <p style="color:#777;font-size:14px;margin-bottom:4px">Order #${order.orderId}</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${itemRows(order.items)}
        ${
          shipping
            ? `<tr><td style="padding:8px 0;color:#777">${order.shippingOption ?? "Shipping"}</td>
               <td style="padding:8px 0;text-align:right;color:#777">${euros(order.shippingAmountCents as number)}</td></tr>`
            : ""
        }
        ${
          total
            ? `<tr><td style="padding:12px 0;font-weight:600">Total</td>
               <td style="padding:12px 0;text-align:right;font-weight:600">${total}</td></tr>`
            : ""
        }
      </table>
      <p>You will hear from us again when the parcel is on its way.</p>
      <p style="color:#777">Pato Turri</p>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Pato Turri <${from}>`,
      to: order.to,
      /* Se omite la clave entera si no hay a donde responder, en vez de
         mandarla en `undefined` y confiar en que el SDK la descarte. */
      ...(replyTo ? { replyTo } : {}),
      subject: `Your order #${order.orderId}`,
      text,
      html,
    });

    if (error) {
      console.error(`[order-email] pedido ${order.orderId}:`, error);
    }
  } catch (error) {
    console.error(`[order-email] pedido ${order.orderId}:`, error);
  }
}

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

export type OrderAlert = {
  orderId: number;
  items: OrderEmailItem[];
  shippingOption: string | null;
  shippingAmountCents: number | null;
  totalCents: number | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: ShippingAddress | null;
};

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
 * El aviso de venta, para el fotógrafo.
 *
 * Hasta acá una compra no le avisaba a nadie: el comprador recibía su
 * confirmación y del lado de Pato la venta solo existía si entraba a
 * /admin/orders a mirar. Un pedido que hay que imprimir y despachar no puede
 * depender de que a alguien se le ocurra revisar una pantalla.
 *
 * Va en castellano y no en inglés como el del comprador: este mail no es del
 * sitio, es del taller. Lo lee una sola persona, la misma que usa el panel.
 *
 * Lleva TODO lo necesario para trabajar el pedido —qué obras, en qué tamaño,
 * cuántas y a qué dirección— para que despachar no obligue a volver al panel.
 * Y el `replyTo` es el comprador: contestarle es apretar responder.
 *
 * Como su hermano, no lanza nunca. Se manda después de que el webhook ya le
 * contestó a Stripe, y una venta cobrada no se puede dar por fallida porque el
 * proveedor de mail esté caído.
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

  const copies = order.items.reduce((total, item) => total + item.quantity, 0);
  const total = order.totalCents !== null ? euros(order.totalCents) : "—";
  const address = addressLines(order.shippingAddress);

  /* El asunto es lo único que se lee en la notificación del teléfono, así que
     dice lo que hay que saber sin abrir: cuántas copias y por cuánto. */
  const subject = `Venta: ${copies} ${copies === 1 ? "copia" : "copias"} · ${total} · pedido #${order.orderId}`;

  /* `null` es una línea que no va; `""` es una línea en blanco que sí va. Sin
     esa distinción —y el mail del comprador, que filtra las vacías a secas, la
     perdía— las secciones salen pegadas una a otra y esto se lee de un vistazo
     en el teléfono o no se lee. */
  const text = [
    `Pedido #${order.orderId}`,
    "",
    "A imprimir:",
    itemLines(order.items),
    order.shippingAmountCents !== null
      ? `  ${order.shippingOption ?? "Envío"}: ${euros(order.shippingAmountCents)}`
      : null,
    `  Total cobrado: ${total}`,
    "",
    "Comprador:",
    `  ${order.customerName ?? "Sin nombre"}`,
    `  ${order.customerEmail ?? "Sin email"}`,
    order.customerPhone ? `  ${order.customerPhone}` : null,
    "",
    "Enviar a:",
    address.length > 0 ? address.map((line) => `  ${line}`).join("\n") : "  Sin dirección",
    "",
    "El pedido también está en patoturri.com/admin/orders",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#111;line-height:1.5">
      <p style="color:#777;font-size:14px;margin-bottom:4px">Pedido #${order.orderId}</p>
      <h2 style="font-size:20px;margin:0 0 18px">${copies} ${copies === 1 ? "copia" : "copias"} · ${total}</h2>

      <p style="font-weight:600;margin-bottom:4px">A imprimir</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${itemRows(order.items)}
        ${
          order.shippingAmountCents !== null
            ? `<tr><td style="padding:8px 0;color:#777">${order.shippingOption ?? "Envío"}</td>
               <td style="padding:8px 0;text-align:right;color:#777">${euros(order.shippingAmountCents)}</td></tr>`
            : ""
        }
        <tr><td style="padding:12px 0;font-weight:600">Total cobrado</td>
            <td style="padding:12px 0;text-align:right;font-weight:600">${total}</td></tr>
      </table>

      <p style="font-weight:600;margin-bottom:4px">Comprador</p>
      <p style="margin-top:0">
        ${order.customerName ?? "Sin nombre"}<br>
        ${order.customerEmail ?? "Sin email"}
        ${order.customerPhone ? `<br>${order.customerPhone}` : ""}
      </p>

      <p style="font-weight:600;margin-bottom:4px">Enviar a</p>
      <p style="margin-top:0">
        ${address.length > 0 ? address.join("<br>") : "Sin dirección"}
      </p>

      <p style="color:#777;font-size:14px">
        El pedido también está en
        <a href="https://patoturri.com/admin/orders">/admin/orders</a>.
      </p>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Tienda Pato Turri <${from}>`,
      to,
      /* Responder a este mail le escribe al comprador, que es lo que se quiere
         hacer cuando algo del pedido no cierra. */
      ...(order.customerEmail ? { replyTo: order.customerEmail } : {}),
      subject,
      text,
      html,
    });

    if (error) {
      console.error(`[order-alert] pedido ${order.orderId}:`, error);
    }
  } catch (error) {
    console.error(`[order-alert] pedido ${order.orderId}:`, error);
  }
}
