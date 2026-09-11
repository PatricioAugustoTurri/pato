import ShopHero from "@/app/shop/components/ShopHero";

/* El esqueleto conserva la proporcion real del catalogo (5 · 7 · 8 · 21) para
   que la pagina no salte de forma cuando llegan los datos, y usa un tono de la
   sala oscura en vez del gris del sistema, que sobre tinta seria un fogonazo.
   Las placas no laten: el pulso baja la opacidad a la mitad y sobre tinta el
   valle las borraria.

   El hero no es un fantasma: la tapa y el titulo son constantes del repo, no
   datos, asi que se pintan de verdad desde el primer frame. Lo unico que late
   es la ficha de cifras, que si depende de la consulta. */
const WEIGHTS = [5, 7, 8, 21];

export default function ShopLoading() {
  return (
    <>
      <ShopHero totals={null} />

      <section className="shop-room is-dark-room">
        <div className="shop-room-wall">
          {WEIGHTS.map((weight) => (
            <div
              className="shop-plate shop-ghost"
              key={weight}
              style={{ "--weight": weight } as React.CSSProperties}
            />
          ))}
        </div>
      </section>
    </>
  );
}
