import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/money";
import { sizeDimensions } from "@/lib/sizes";
import CartQuantity from "./CartQuantity";

export default function CartLine({
  item,
  onRemove,
  onQuantity,
}: {
  item: CartItem;
  onRemove: (photoId: number, size: string) => void;
  onQuantity: (photoId: number, size: string, quantity: number) => void;
}) {
  const size = item.attributes?.size ?? item.size;
  const unitPrice = Number(item.attributes?.price ?? item.price);
  const lineTotal = unitPrice * item.quantity;
  const dimensions = sizeDimensions(size);

  return (
    <article className="cart-line">
      {/* `contain`, no `cover`: la proporcion es parte de lo que se esta
          comprando, y una copia vertical y una horizontal tienen que leerse
          distintas en la misma lista. El resto del sitio tampoco recorta la
          obra. Antes esto era un `background-image` crudo — la unica imagen de
          la pagina viajando sin optimizar. */}
      <div className="cart-line-plate">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.alt ?? item.name}
            fill
            sizes="(max-width: 900px) 26vw, 140px"
            quality={85}
            style={{ objectFit: "contain" }}
          />
        )}
      </div>

      <div className="cart-line-what">
        <h2>
          {/* Los carritos guardados antes de que `href` existiera no lo tienen:
              ahi el titulo es texto plano en vez de romperse. */}
          {item.href ? <Link href={item.href}>{item.name}</Link> : item.name}
        </h2>
        <p className="cart-line-spec">
          {size}
          {dimensions && <span aria-hidden="true"> · </span>}
          {dimensions}
        </p>
        <CartQuantity
          quantity={item.quantity}
          title={item.name}
          size={size}
          onChange={(quantity) => onQuantity(item.photoId, size, quantity)}
        />
      </div>

      <div className="cart-line-money">
        <strong>{formatPrice(lineTotal)}</strong>
        {/* El precio unitario solo aparece cuando hay mas de una copia: con una
            sola repetiria la cifra de arriba. */}
        {item.quantity > 1 && <span>{formatPrice(unitPrice)} each</span>}
        {/* El filete lo lleva el span, no el boton: en tactil el boton crece a
            44px de alto y un `border-bottom` suyo se despegaria del texto. Se
            agranda el area, no el dibujo. */}
        <button type="button" className="cart-remove" onClick={() => onRemove(item.photoId, size)}>
          <span className="cart-remove-rule">Remove</span>
          <span className="sr-only"> {item.name}, size {size}</span>
        </button>
      </div>
    </article>
  );
}
