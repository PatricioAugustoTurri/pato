import Link from "next/link";

/* Sin ilustracion y sin consuelo: no hay nada que contar todavia, y una tienda
   de un solo autor no tiene "productos destacados" que ofrecer aca sin
   inventarlos. Una salida, la del catalogo. */
export default function CartEmpty() {
  return (
    <div className="cart-note">
      <h1>
        Nothing here <i>yet.</i>
      </h1>
      <p>Every print you choose waits here until you are ready to order it.</p>
      <Link href="/shop" className="text-link">
        Browse the work <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
