import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { catalogSizes } from "@/lib/photo-variants";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { KNOWN_SIZES } from "@/lib/sizes";

type SizePayload = {
  size?: string;
  price?: number | string;
};

type SizesPayload = {
  sizes?: SizePayload[];
};

export async function GET() {
  const sizes = await pool.query<{ id: number; size: string; price: string; position: number }>(
    "SELECT id, size, price, position FROM catalog_sizes ORDER BY position ASC, id ASC",
  );

  return NextResponse.json(
    sizes.rows.map((row) => ({ ...row, price: Number(row.price) })),
  );
}

/**
 * Reescribe la lista de precios del catálogo entera, no un tamaño suelto.
 *
 * Es a propósito: la lista es una sola cosa —qué se vende y en qué orden se
 * lee— y editarla fila por fila deja estados intermedios que no significan
 * nada, como un catálogo sin ningún tamaño entre dos llamadas. El panel manda
 * la lista completa y acá se reemplaza dentro de una transacción.
 *
 * Y lo más importante: cambiar un precio acá tiene que cambiar el precio de
 * TODA obra publicada. `photo_variants` es lo que lee el checkout para
 * re-tarifar, así que una lista nueva sin propagar sería un catálogo que
 * anuncia €60 y cobra €55. Por eso el UPDATE de abajo no es opcional ni
 * diferido: viaja en la misma transacción.
 */
export async function PUT(request: Request) {
  let payload: SizesPayload;
  try {
    payload = (await request.json()) as SizesPayload;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
  }

  const incoming = Array.isArray(payload.sizes) ? payload.sizes : null;

  if (!incoming || incoming.length === 0) {
    return NextResponse.json(
      { error: "Tiene que quedar al menos un tamaño a la venta." },
      { status: 400 },
    );
  }

  const sizes: { size: string; price: number }[] = [];

  for (const entry of incoming) {
    const size = String(entry.size ?? "").trim().toUpperCase();
    const price = Number(entry.price);

    /* Solo medidas conocidas. El nombre del tamaño no es una etiqueta suelta:
       `sizeDimensions` lo usa de clave para decir cuánto mide, así que un
       «A3 grande» escrito a mano saldría a la venta sin medida en la ficha, en
       el carrito y en el email del pedido. */
    if (!(KNOWN_SIZES as readonly string[]).includes(size)) {
      return NextResponse.json(
        { error: `«${entry.size}» no es una medida conocida.` },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: `El precio de ${size} no es válido.` },
        { status: 400 },
      );
    }

    if (sizes.some((already) => already.size === size)) {
      return NextResponse.json({ error: `${size} está repetido.` }, { status: 400 });
    }

    sizes.push({ size, price });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    for (const [index, { size, price }] of sizes.entries()) {
      await client.query(
        `INSERT INTO catalog_sizes (size, price, position)
         VALUES ($1, $2, $3)
         ON CONFLICT (size)
         DO UPDATE SET price = EXCLUDED.price, position = EXCLUDED.position, updated_at = now()`,
        [size, price, index + 1],
      );
    }

    const kept = sizes.map(({ size }) => size);

    await client.query(
      "DELETE FROM catalog_sizes WHERE NOT (size = ANY($1::varchar[]))",
      [kept],
    );

    /* El precio nuevo baja a todas las obras. `photo_variants` guarda el suyo
       por obra porque es lo que lee el checkout, y dejarlo viejo sería anunciar
       un precio y cobrar otro. */
    await client.query(
      `UPDATE photo_variants v
       SET price = s.price, updated_at = now()
       FROM catalog_sizes s
       WHERE v.size = s.size AND v.price IS DISTINCT FROM s.price`,
    );

    /* Un tamaño retirado de la lista deja de venderse en toda la tienda. Se
       borra de las obras y no se queda escondido: si sigue en `photo_variants`,
       la ficha lo ofrece igual, porque lee las variantes de la obra y no esta
       tabla. Los pedidos ya hechos no se tocan — guardan su propia copia del
       tamaño y del precio pagado. */
    await client.query(
      "DELETE FROM photo_variants WHERE NOT (size = ANY($1::varchar[]))",
      [kept],
    );

    await client.query("COMMIT");

    revalidateCatalog();

    return NextResponse.json(await catalogSizes());
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message.includes("duplicate key") ? "Ese tamaño ya está en la lista." : "No se pudo guardar la lista de precios." },
      { status: message.includes("duplicate key") ? 409 : 500 },
    );
  } finally {
    client?.release();
  }
}
