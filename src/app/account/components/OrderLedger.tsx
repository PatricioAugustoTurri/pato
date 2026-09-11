import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import type { CustomerOrder, OrderLine } from "@/lib/orders";
import { orderDate, orderNumber, statusLabel } from "./status";

/* El libro. Un pedido es un grupo de filas con filete, nunca una tarjeta: una
   caja alrededor de cada pedido sería el mismo marco que el sitio le saca a las
   fotografías. */
export default function OrderLedger({ orders }: { orders: CustomerOrder[] }) {
  /* Una sola lectura del reloj para toda la lista: si cada fila llamara a
     `Date.now()` por su cuenta, dos pedidos creados en el mismo segundo podrían
     caer a distinto lado de la ventana de confirmación. */
  const now = Date.now();

  return (
    <div className="order-ledger">
      {orders.map((order) => (
        <section className="order" key={order.id} aria-labelledby={`order-${order.id}`}>
          <div className="order-head">
            <h2 className="order-no" id={`order-${order.id}`}>
              {orderNumber(order.id)}
            </h2>
            <span className="order-date">{orderDate(order.createdAt)}</span>
            <span className="order-status" data-status={order.status}>
              {statusLabel(order, now)}
            </span>
          </div>

          <div className="order-lines">
            {order.lines.map((line) => (
              <LedgerLine key={line.key} line={line} />
            ))}
          </div>

          <dl className="order-foot">
            <div>
              <dt>Items</dt>
              <dd>{formatPrice(order.itemsCents / 100)}</dd>
            </div>
            {/* Envío y total quedan en NULL hasta que entra el webhook. Un
                pedido sin confirmar no anuncia un total que el sistema todavía
                no sabe: dice lo único que sí sabe, lo que suman las copias. */}
            {order.shippingCents !== null && (
              <div>
                <dt>{order.shippingOption ?? "Shipping"}</dt>
                <dd>{formatPrice(order.shippingCents / 100)}</dd>
              </div>
            )}
            {order.totalCents !== null && (
              <div className="is-total">
                <dt>Total</dt>
                <dd>{formatPrice(order.totalCents / 100)}</dd>
              </div>
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}

function LedgerLine({ line }: { line: OrderLine }) {
  const copies = `${line.quantity} ${line.quantity === 1 ? "copy" : "copies"}`;

  return (
    <article className="order-line">
      {/* `contain`, no `cover`: la copia comprada ES la mercadería, y su
          proporción es parte de lo que se pagó. */}
      <div className="order-line-plate">
        {line.imageUrl && (
          <Image
            src={line.imageUrl}
            alt={line.alt}
            fill
            sizes="(max-width: 900px) 26vw, 140px"
            quality={85}
            style={{ objectFit: "contain" }}
          />
        )}
      </div>

      <div className="order-line-what">
        <h3>
          {/* Sin enlace si la obra ya no está, o si perdió su colección: sin
              colección no hay ruta, y un enlace roto es peor que texto plano. */}
          {line.href ? <Link href={line.href}>{line.title}</Link> : line.title}
        </h3>
        <p className="order-line-spec">
          {[line.size, line.dimensions, copies].filter(Boolean).join(" · ")}
        </p>
        {line.gone && <p className="order-line-gone">No longer in the shop</p>}
      </div>

      <span className="order-line-money">{formatPrice(line.lineCents / 100)}</span>
    </article>
  );
}
