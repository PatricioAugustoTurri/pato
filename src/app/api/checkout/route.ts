import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { parseCheckoutItems } from "@/lib/checkout-cart";
import { auth } from "@/lib/auth";
import {
  SHIPPING_COUNTRIES,
  SHIPPING_CURRENCY,
  isShippingRegion,
  stripeShippingOptions,
  type ShippingRegion,
} from "@/lib/shipping";

export async function POST(request: Request) {
  /* Comprar no pide cuenta. Antes la ruta rechazaba a quien no hubiera
     iniciado sesión, y el carrito lo mandaba a registrarse justo después de
     decidir: el peor momento para pedirle un formulario a alguien, y el lugar
     donde se pierde un regalo. Stripe ya pide el email y la dirección, que es
     todo lo que el pedido necesita para llegar.

     Si hay sesión, el pedido se cuelga de la cuenta —así aparece en
     /account— y Stripe abre con el email ya escrito. Si no, el pedido queda
     sin dueño y la confirmación por mail es la constancia. */
  const authSession = await auth();
  const sessionUserId = Number(authSession?.user?.id);
  const userId = Number.isInteger(sessionUserId) && sessionUserId > 0 ? sessionUserId : null;
  const userEmail = userId ? (authSession?.user?.email ?? null) : null;

  let rawItems: unknown;
  let region: ShippingRegion;

  try {
    const body = (await request.json()) as { items?: unknown; region?: unknown };
    rawItems = body.items;

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

  const cart = parseCheckoutItems(rawItems);

  if (!cart.ok) {
    return NextResponse.json({ error: cart.error }, { status: 400 });
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

    for (const item of cart.lines) {
      const { rows } = await client.query<{
        price: string;
        currency: string;
        name: string;
      }>(
        `SELECT pv.price, pv.currency, p.name
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

      const currency = variant.currency.trim().toLowerCase();

      /* El envío se cobra en euros y así está escrito en `SHIPPING_RATES`. Una
         variante cargada en otra moneda mezcla dos monedas en la misma sesión,
         que Stripe rechaza entera: el comprador no vería "esta obra no se puede
         comprar", vería el checkout caerse. Se corta acá, con nombre y apellido
         en el log, porque no es un error del que compra sino un dato mal
         cargado en el panel. */
      if (currency !== SHIPPING_CURRENCY) {
        console.error(
          `[checkout] "${variant.name}" (${item.size}) está cargada en ${currency} y el envío se cobra en ${SHIPPING_CURRENCY}`,
        );
        return NextResponse.json(
          { error: `"${variant.name}" is not on sale right now.` },
          { status: 503 },
        );
      }

      const unitAmount = Math.round(Number(variant.price) * 100);
      totalCents += unitAmount * item.quantity;

      lineItems.push({
        price_data: {
          currency,
          product_data: { name: `${variant.name} (${item.size})` },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      });

      orderItems.push({
        photoId: item.photoId,
        size: item.size,
        quantity: item.quantity,
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
      /* Con sesión, el email de la cuenta llega escrito: es el mismo al que va
         la confirmación y el que liga el pedido a /account. */
      ...(userEmail ? { customer_email: userEmail } : {}),
      /* Lo último que se lee antes de pagar. Las condiciones de venta tienen
         que estar a la vista en el momento de comprar, no solo en el pie de
         página. La dirección va escrita y no como enlace: los tipos de Stripe no
         prometen que este campo dibuje vínculos, y una dirección legible sirve
         igual en los dos casos. */
      custom_text: {
        submit: {
          message: `By paying you accept the Terms of Sale at ${new URL(origin).host}/terms, including the 14-day right to return.`,
        },
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
    /* El mensaje de adentro se queda adentro. Venía de Stripe o de Postgres y
       terminaba en la pantalla del comprador: a él no le dice nada que pueda
       usar, y a veces cuenta cómo está armada la base. Al log, que es donde se
       lee cuando algo falla de verdad. */
    console.error("[checkout] no se pudo crear la sesión de pago:", error);
    return NextResponse.json({ error: "We could not start the payment." }, { status: 500 });
  } finally {
    client.release();
  }
}
