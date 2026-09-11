/* Zustand lee `cart-storage` DESPUES del primer render, asi que hasta ahora la
   pagina pintaba "no agregaste nada" y recien despues aparecian las copias: un
   carrito lleno que arranca diciendo que esta vacio. Estos fantasmas tienen la
   altura real de una linea, de modo que cuando llegan los datos nada salta.
   Misma disciplina que `shop/loading.tsx`. */
export function CartLinesSkeleton() {
  return (
    <div className="cart-lines" aria-hidden="true">
      {[0, 1].map((index) => (
        <div className="cart-line is-ghost" key={index}>
          <div className="cart-line-plate shop-ghost" />
          <div className="cart-line-what">
            <span className="cart-ghost-line shop-ghost" style={{ width: "min(58%, 280px)" }} />
            <span className="cart-ghost-line shop-ghost" style={{ width: "120px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* El mostrador tambien se fantasmea. Sin esto la columna derecha pintaba tinta
   y recien se volvia crema cuando localStorage contestaba: el mismo parpadeo
   que veniamos a sacar, mudado de la lista al campo. */
export function CartCounterSkeleton() {
  return (
    <div className="cart-counter" aria-hidden="true">
      <div className="cart-counter-inner">
        <p className="cart-counter-legend">Shipping</p>
        <span className="cart-ghost-line skeleton-line" style={{ width: "100%" }} />
        <span className="cart-ghost-line skeleton-line" style={{ width: "80%" }} />
        <span className="cart-ghost-checkout skeleton-line" />
      </div>
    </div>
  );
}
