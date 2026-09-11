import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { pool } from "@/lib/db";

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

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        /* `AND status <> 'paid'` es lo que hace segura esta ruta. Stripe
           reintenta el mismo evento —ante un timeout, un 500, o porque sí— y
           sin esta condición cada reintento volvería a descontar stock de una
           compra que ya se cobró una sola vez. Si no vuelve fila, el pedido ya
           estaba cobrado y no hay nada que hacer. */
        const { rows } = await client.query<{ items: OrderItem[] }>(
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
           RETURNING items`,
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

        /* El stock baja acá y no en el checkout: hasta que Stripe no confirma
           el cobro no hay venta, y una sesión abandonada no puede descontar
           una copia que nadie pagó.

           `GREATEST(..., 0)` porque el stock no es una reserva: entre que se
           comprueba en el checkout y que se cobra pueden entrar dos compras
           del mismo tamaño. Con eso el número queda en cero en vez de en
           negativo, que es un dato que ninguna pantalla sabría leer. */
        for (const item of rows[0]?.items ?? []) {
          await client.query(
            `UPDATE photo_variants
             SET stock = GREATEST(stock - $3, 0)
             WHERE photo_id = $1 AND size = $2`,
            [item.photoId, item.size, item.quantity],
          );
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch {
      return NextResponse.json({ error: "No se pudo actualizar la orden." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
