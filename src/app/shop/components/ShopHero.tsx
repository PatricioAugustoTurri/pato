import Image from "next/image";
import type { ArchiveTotals } from "@/app/shop/page";

/* Mismo mecanismo que la portada, el about y cada coleccion: `.hero-section`
   con la fotografia a sangre bajo los dos velos, el titulo apoyado encima y la
   ficha del archivo contra el borde inferior. La tienda era el unico eslabon
   de la cadena home → /shop → /shop/[slug] que abria sin una obra adelante:
   se entraba a la sala por una linea de texto sobre tinta.

   La tapa es un archivo del repositorio y no sale de `photos` a proposito: no
   es una obra del catalogo, asi que el muro de abajo no la anuncia ni la
   ofrece a la venta. Mismo trato que la tapa de la portada. */
const COVER = "/Pato/_MG_7669.jpg";
const COVER_ALT =
  "Una mujer atiende un puesto de comida de madera al borde del camino en Japon, bajo una cortina de tela colgada, entre fotografias enmarcadas y un termo de te";

export default function ShopHero({ totals }: { totals: ArchiveTotals | null }) {
  return (
    <section className="hero-section shop-hero">
      <div className="hero-media">
        <Image src={COVER} alt={COVER_ALT} fill priority sizes="100vw" quality={90} />
      </div>

      <div className="hero-inner">
        <h1 className="hero-title">Shop</h1>

        {/* `null` = todavia no sabemos las cifras. El filete y su altura ya
            estan, asi que cuando llegan los numeros nada se mueve. */}
        {totals === null ? (
          <div className="hero-index" aria-hidden="true">
            <div className="shop-ghost animate-pulse" style={{ height: 15, width: 260 }} />
          </div>
        ) : (
          totals.obras > 0 && (
            <dl className="hero-index">
              <div><dt>Works</dt><dd>{totals.obras}</dd></div>
              <div><dt>Countries</dt><dd>{totals.paises}</dd></div>
              <div><dt>Collections</dt><dd>{totals.colecciones}</dd></div>
            </dl>
          )
        )}
      </div>
    </section>
  );
}
