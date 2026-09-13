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
