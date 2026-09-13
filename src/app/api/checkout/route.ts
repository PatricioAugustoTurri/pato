import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  SHIPPING_COUNTRIES,
  isShippingRegion,
  stripeShippingOptions,
  type ShippingRegion,
} from "@/lib/shipping";

type CheckoutRequestItem = {
  photoId: number;
  size: string;
  quantity: number;
};

export async function POST(request: Request) {
  const authSession = await auth();

  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "You need to sign in to buy." }, { status: 401 });
  }

  const userId = Number(authSession.user.id);
  const userEmail = authSession.user.email ?? null;

  let items: CheckoutRequestItem[];
  let region: ShippingRegion;

  try {
    const body = (await request.json()) as { items?: CheckoutRequestItem[]; region?: unknown };
    items = Array.isArray(body.items) ? body.items : [];

    /* La zona se comprueba acá, como el precio: el navegador propone y el
       servidor decide. Un valor inventado no cae a la tarifa más barata, se
       rechaza. */
    if (!isShippingRegion(body.region)) {
      return NextResponse.json({ error: "Choose where the order ships to." }, { status: 400 });
    }
    region = body.region;
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
  }

  const client = await pool.connect();

  try {
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];
    const orderItems: Array<{ photoId: number; size: string; quantity: number; unitAmountCents: number; name: string }> = [];
    let totalCents = 0;

    for (const item of items) {
      const quantityRequested = Number(item.quantity) || 1;

      const { rows } = await client.query<{
        price: string;
        currency: string;
        stock: number;
        name: string;
      }>(
        `SELECT pv.price, pv.currency, pv.stock, p.name
         FROM photo_variants pv
         INNER JOIN photos p ON p.id = pv.photo_id
         WHERE pv.photo_id = $1 AND pv.size = $2
         LIMIT 1`,
        [item.photoId, item.size],
      );

      const variant = rows[0];

      if (!variant) {
        return NextResponse.json(
          { error: `The ${item.size} size is no longer available for this photograph.` },
          { status: 400 },
        );
      }

      if (variant.stock < quantityRequested) {
        return NextResponse.json(
          { error: `There is not enough stock of "${variant.name}" (${item.size}).` },
          { status: 400 },
        );
      }

      const unitAmount = Math.round(Number(variant.price) * 100);
      totalCents += unitAmount * quantityRequested;

      lineItems.push({
        price_data: {
          currency: variant.currency.trim().toLowerCase(),
          product_data: { name: `${variant.name} (${item.size})` },
          unit_amount: unitAmount,
        },
        quantity: quantityRequested,
      });

      orderItems.push({
        photoId: item.photoId,
        size: item.size,
        quantity: quantityRequested,
        unitAmountCents: unitAmount,
        name: variant.name,
      });
    }

    const origin = request.headers.get("origin") ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      /* El sitio está en inglés y la página de pago es la pantalla siguiente a
         la nuestra. Sin esto Stripe usa `auto`, que mira el idioma del
         navegador: el mismo carrito terminaba en español o en italiano según
         quién comprara. */
      locale: "en",
      line_items: lineItems,
      /* Solo los países de la zona elegida. Stripe se encarga de que no entre
         una dirección que no corresponda a la tarifa que se está cobrando. */
      shipping_address_collection: {
        allowed_countries: SHIPPING_COUNTRIES[
          region
        ] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      phone_number_collection: {
        enabled: true,
      },
      shipping_options: stripeShippingOptions(region),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    await client.query(
      `INSERT INTO orders (stripe_session_id, status, items, total_cents, email, user_id)
       VALUES ($1, 'pending', $2::jsonb, $3, $4, $5)`,
      [session.id, JSON.stringify(orderItems), totalCents, session.customer_email ?? userEmail, userId],
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not start the payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
