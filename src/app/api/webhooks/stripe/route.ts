import { NextResponse, after } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { orderEmailLines } from "@/lib/orders";
import {
  sendOrderAlert,
  sendOrderConfirmation,
  type OrderAlert,
  type OrderConfirmation,
} from "@/lib/order-email";

/** Lo que el checkout guarda en `orders.items`. */
type OrderItem = {
  photoId: number;
  size: string;
  quantity: number;
  unitAmountCents: number;
  name: string;
};

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "El pago no está configurado todavía." }, { status: 503 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionSummary = event.data.object as Stripe.Checkout.Session;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionSummary.id, {
        expand: ["shipping_cost.shipping_rate"],
      });

      const customerDetails = session.customer_details;
      const shippingAddress = session.collected_information?.shipping_details?.address ?? null;
      const shippingRate = session.shipping_cost?.shipping_rate;
      const shippingOptionName =
        shippingRate && typeof shippingRate !== "string" ? shippingRate.display_name : null;

      /* Se llenan solo si el UPDATE de abajo devuelve fila, o sea si este
         evento es el primero que cobra este pedido. Viven fuera del `try` de la
         transaccion porque los mails se mandan despues de cerrarla.

         Son dos y no uno: la confirmacion al comprador necesita su direccion de
         mail, el aviso a Pato no. Una compra en la que Stripe no nos deja un
         mail del comprador es rara pero posible, y en ese caso el pedido tiene
         que llegarle igual a quien lo va a imprimir. */
      let confirmation: OrderConfirmation | null = null;
      let alert: OrderAlert | null = null;
      let sold: { id: number; items: OrderItem[]; email: string | null; createdAt: Date | null } | null =
        null;

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        /* `AND status <> 'paid'` es lo que hace segura esta ruta. Stripe
           reintenta el mismo evento —ante un timeout, un 500, o porque sí— y
           sin esta condición cada reintento volvería a mandar los mails de una
           compra que ya se cobró una sola vez. Si no vuelve fila, el pedido ya
           estaba cobrado y no hay nada que hacer. */
        const { rows } = await client.query<{
          id: number;
          items: OrderItem[];
          email: string | null;
          createdAt: Date | null;
        }>(
          `UPDATE orders
           SET status = 'paid',
               email = COALESCE($2, email),
               customer_name = $3,
               customer_phone = $4,
               shipping_address = $5::jsonb,
               shipping_option = $6,
               shipping_amount_cents = $7,
               amount_total_cents = $8
           WHERE stripe_session_id = $1 AND status <> 'paid'
           RETURNING id, items, email, created_at AS "createdAt"`,
          [
            session.id,
            customerDetails?.email ?? null,
            customerDetails?.name ?? null,
            customerDetails?.phone ?? null,
            shippingAddress ? JSON.stringify(shippingAddress) : null,
            shippingOptionName,
            session.shipping_cost?.amount_total ?? null,
            session.amount_total ?? null,
          ],
        );

        /* La fila que devuelve el UPDATE es la que autoriza a mandar los mails:
           si Stripe reintenta el evento, no vuelve ninguna y nadie recibe una
           segunda confirmacion de la misma compra. */
        sold = rows[0] ?? null;

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      /* Las lineas se arman DESPUES de cerrar la transaccion: enriquecerlas
         consulta el catalogo —la miniatura y la descripcion de cada obra— y eso
         no tiene por que ocurrir con la fila del pedido bloqueada. */
      if (sold) {
        const base = {
          orderId: sold.id,
          placedAt: sold.createdAt ?? new Date(),
          lines: await orderEmailLines(sold.items ?? []),
          shippingOption: shippingOptionName,
          shippingAmountCents: session.shipping_cost?.amount_total ?? null,
          totalCents: session.amount_total ?? null,
          shippingAddress,
        };

        alert = {
          ...base,
          customerName: customerDetails?.name ?? null,
          customerEmail: sold.email,
          customerPhone: customerDetails?.phone ?? null,
        };

        if (sold.email) {
          confirmation = { ...base, to: sold.email, customerName: customerDetails?.name ?? null };
        }
      }

      /* Despues de la respuesta, no antes. Stripe espera un 200 rapido y
         reintenta el evento si tarda; que Resend este lento o caido no puede
         hacer que un cobro ya procesado vuelva a entrar por la puerta. */
      if (confirmation) {
        const order = confirmation;
        after(() => sendOrderConfirmation(order));
      }

      /* En su propio `after`, no encadenado al de arriba: si el mail del
         comprador falla, el aviso de la venta tiene que salir igual. Son dos
         destinatarios distintos y ninguno depende del otro. */
      if (alert) {
        const order = alert;
        after(() => sendOrderAlert(order));
      }
    } catch {
      return NextResponse.json({ error: "No se pudo actualizar la orden." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
