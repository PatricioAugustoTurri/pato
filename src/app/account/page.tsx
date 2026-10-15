import Link from "next/link";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatAddress, getOrdersForUser, type CustomerOrder } from "@/lib/orders";
import { getMemberSince } from "@/lib/users";
import OrderLedger from "./components/OrderLedger";
import SignOutButton from "./components/SignOutButton";
import { orderDate } from "./components/status";

/* Componente de servidor. Antes era de cliente con `useSession()`, que obligaba
   a dibujar un esqueleto y después reemplazarlo; acá los pedidos ya vienen
   resueltos en el HTML. De paso habilita `metadata`, que un componente de
   cliente no puede exportar. `auth()` lee cookies, así que la ruta queda
   dinámica sola: no hace falta declarar `dynamic`. */
export default async function AccountPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!session?.user || !Number.isInteger(userId) || userId <= 0) {
    return <SignedOut />;
  }

  const [orders, memberSince] = await Promise.all([
    getOrdersForUser(userId),
    getMemberSince(userId),
  ]);

  return (
    <main className="order-room is-dark-room">
      <div className="order-wall">
        {orders && orders.length > 0 && <p className="order-count">{countLine(orders)}</p>}
        <h1>
          Your <i>orders.</i>
        </h1>
        {orders === null ? <LedgerUnreadable /> : orders.length === 0 ? <NoOrders /> : <OrderLedger orders={orders} />}
      </div>

      <div className="order-counter">
        <section className="order-counter-inner" aria-labelledby="account-counter-heading">
          <h2 className="sr-only" id="account-counter-heading">
            Your account
          </h2>
          <p className="order-counter-legend">Account</p>

          {session.user.name && <p className="order-who">{session.user.name}</p>}
          {session.user.email && <p className="order-mail">{session.user.email}</p>}

          <Facts orders={orders} memberSince={memberSince} />
          <LastOrderAddress orders={orders} />

          <SignOutButton />

          <p className="order-note">
            Anything about an order goes to <a href="mailto:info@patoturri.com">info@patoturri.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

/* La ranura mono lleva datos, no un rótulo. El tercer término solo aparece si
   hay algo sin pagar: si no, no tendría nada que contar. */
function countLine(orders: CustomerOrder[]): string {
  const prints = orders.reduce((sum, order) => sum + order.prints, 0);
  const unpaid = orders.filter((order) => order.status === "pending").length;

  const parts = [
    `${orders.length} ${orders.length === 1 ? "order" : "orders"}`,
    `${prints} ${prints === 1 ? "print" : "prints"}`,
  ];
  if (unpaid > 0) parts.push(`${unpaid} not paid`);

  return parts.join(" · ");
}

function Facts({ orders, memberSince }: { orders: CustomerOrder[] | null; memberSince: Date | null }) {
  /* Solo se suma lo que de verdad se cobró: un pedido sin confirmar no tiene
     total, y contarlo como gastado sería inventar plata que no se movió. */
  const settled = (orders ?? []).filter((order) => order.totalCents !== null);
  const spent = settled.reduce((sum, order) => sum + (order.totalCents ?? 0), 0);
  const prints = (orders ?? []).reduce((sum, order) => sum + order.prints, 0);
  const hasOrders = (orders?.length ?? 0) > 0;

  if (!memberSince && !hasOrders) return null;

  return (
    <dl className="order-facts">
      {memberSince && (
        <div>
          <dt>Member since</dt>
          <dd>{orderDate(memberSince)}</dd>
        </div>
      )}
      {/* "0 pedidos · €0" es cierto y no le sirve a nadie: en una cuenta recién
          hecha esas dos filas solo dicen que está vacía, que ya lo dice la pared. */}
      {hasOrders && (
        <div>
          <dt>Prints ordered</dt>
          <dd>{prints}</dd>
        </div>
      )}
      {settled.length > 0 && (
        <div>
          <dt>Spent</dt>
          <dd>{formatPrice(spent / 100)}</dd>
        </div>
      )}
    </dl>
  );
}

/* Historia, no ficha: no existen direcciones guardadas en el sistema, así que
   esto no lleva ningún control que prometa cambiarla.

   El rótulo tampoco puede decir "enviado a": la dirección la escribe el webhook
   de Stripe al pasar el pedido a `paid`, no al despacharlo, así que un pedido
   pagado y todavía sin enviar anunciaría un envío que no ocurrió. Dice lo que
   el dato es: la dirección que quedó en el último pedido. */
function LastOrderAddress({ orders }: { orders: CustomerOrder[] | null }) {
  const address = formatAddress(orders?.find((order) => order.address)?.address ?? null);
  if (!address) return null;

  return (
    <p className="order-address">
      <b>Address on your last order</b>
      {address}
    </p>
  );
}

function NoOrders() {
  return (
    <div className="order-message">
      <h2>
        No orders <i>yet.</i>
      </h2>
      <p>When you order a print, it stays here — what you chose, what it cost, and where it went.</p>
      <Link className="text-link" href="/shop">
        Browse the work <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}

/* La base no contestó. Decirlo es obligatorio: dibujar "todavía no compraste
   nada" sería una afirmación falsa sobre la plata de alguien. */
function LedgerUnreadable() {
  return (
    <div className="order-message">
      <h2>
        We couldn&apos;t read your <i>orders.</i>
      </h2>
      <p>
        Nothing is lost — this is a problem on our side. Try again in a moment, or write to{" "}
        <a href="mailto:info@patoturri.com">info@patoturri.com</a>.
      </p>
    </div>
  );
}

/* La ruta no está protegida en `proxy.ts` a propósito, así que este estado es
   alcanzable y tiene que ofrecer la puerta en vez de ser otro callejón. */
function SignedOut() {
  return (
    <main className="cart-room is-empty is-dark-room">
      <div className="cart-note">
        <h1>
          Your orders live <i>here.</i>
        </h1>
        <p>Sign in to see what you ordered, what it cost, and where it was sent.</p>
        <Link className="text-link" href="/login?callbackUrl=/account">
          Sign in <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
