import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { MAX_PER_LINE } from "@/lib/cart-limits";
import { auth } from "@/lib/auth";
import {
  SHIPPING_COUNTRIES,
  SHIPPING_CURRENCY,
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

  /* Lo que se pide, ya comprobado y con las líneas repetidas sumadas.

     Sumarlas importa: la misma obra y el mismo tamaño podían llegar en dos
     líneas —dos pestañas abiertas, un carrito viejo— y Stripe las cobraba como
     dos renglones idénticos. Juntas, el comprador ve "3 copias" y no la misma
     obra escrita tres veces.

     Y comprobarlas importa igual: la cantidad entraba por `Number(...) || 1`,
     que aceptaba un -3, un 1,5 y un 1e21. Ninguno llegaba a cobrarse porque
     Stripe los rechazaba, pero el comprador terminaba leyendo el error de
     Stripe en pantalla en vez de que el carrito le dijera que estaba mal. */
  const wanted = new Map<string, { photoId: number; size: string; quantity: number }>();

  for (const item of items) {
    const photoId = Number(item.photoId);
    const size = typeof item.size === "string" ? item.size.trim() : "";
    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(photoId) ||
      photoId <= 0 ||
      !size ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return NextResponse.json(
        { error: "There is something wrong with your cart. Empty it and try again." },
        { status: 400 },
      );
    }

    const key = `${photoId}|${size}`;
    const already = wanted.get(key)?.quantity ?? 0;
    wanted.set(key, { photoId, size, quantity: already + quantity });
  }

  /* El tope se comprueba DESPUES de sumar las lineas repetidas, que es la unica
     forma de que valga: dos lineas de seis copias de la misma obra y el mismo
     tamano pasan cualquier control que las mire por separado.

     Y se comprueba acá aunque el carrito ya lo impida, porque el carrito corre
     en el navegador: esto no es una segunda opinion, es la unica que cuenta. */
  for (const item of wanted.values()) {
    if (item.quantity > MAX_PER_LINE) {
      return NextResponse.json(
        { error: `The maximum is ${MAX_PER_LINE} copies of the same size. Lower the quantity and try again.` },
        { status: 400 },
      );
    }
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

    for (const item of wanted.values()) {
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
