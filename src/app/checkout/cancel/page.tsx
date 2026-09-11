import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="cart-room is-empty is-dark-room">
      <div className="cart-note">
        <h1>
          The payment was <i>not</i> completed.
        </h1>
        <p>Your cart is untouched. You can pick it up again whenever you want.</p>
        <Link href="/cart" className="text-link">
          Back to cart <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
