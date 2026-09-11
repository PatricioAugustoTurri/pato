import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { pool } from "@/lib/db";

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

      await pool.query(
        `UPDATE orders
         SET status = 'paid',
             email = COALESCE($2, email),
             customer_name = $3,
             customer_phone = $4,
             shipping_address = $5::jsonb,
             shipping_option = $6,
             shipping_amount_cents = $7,
             amount_total_cents = $8
         WHERE stripe_session_id = $1`,
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
    } catch {
      return NextResponse.json({ error: "No se pudo actualizar la orden." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
