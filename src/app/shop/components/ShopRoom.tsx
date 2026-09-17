import Image from "next/image";
import Link from "next/link";
import ShopHero from "@/app/shop/components/ShopHero";
import type { ArchiveTotals, CategoryRow } from "@/app/shop/page";

function normalizeCategoryImage(images: unknown): string {
  if (Array.isArray(images)) {
    const first = images[0];
    if (Array.isArray(first)) {
      return typeof first[0] === "string" ? first[0] : "";
    }
    return typeof first === "string" ? first : "";
  }

  return "";
}

/* Las descripciones de coleccion son texto de autor de unos 1.100 caracteres.
   Entero es un muro; la primera oracion es una invitacion. Se corta por el
   primer punto seguido de espacio para no partir "ee.uu." ni un decimal. */
function openingLine(text: string | null | undefined): string {
  if (!text) return "";
  const clean = text.trim();
  const end = clean.search(/[.!?](\s|$)/);
  if (end === -1) return clean.length > 220 ? `${clean.slice(0, 217)}…` : clean;
  return clean.slice(0, end + 1);
}

export default function ShopRoom({
  categories,
  totals,
}: {
  categories: CategoryRow[] | null;
  totals: ArchiveTotals;
}) {
  return (
    <>
      <ShopHero totals={totals} />

      <section className="shop-room is-dark-room">
        {categories === null ? (
          <p className="shop-room-empty">
            The archive did not load. Reload the page — if it keeps failing,
            write to info@patoturri.com and we will sort it out.
          </p>
        ) : categories.length === 0 ? (
          <p className="shop-room-empty">
            No collections are published yet. New work goes up here first.
          </p>
        ) : (
          <div className="shop-room-wall">
            {categories.map((category) => {
              const imageUrl = normalizeCategoryImage(category.images);
              const line = openingLine(category.descripcion);

              return (
                <Link
                  className="shop-plate"
                  key={category.id}
                  href={`/shop/${category.slug}`}
                  /* El ancho del panel es la cantidad de obras. Cuatro paneles
                     iguales dirian que las colecciones pesan lo mismo, y no. */
                  style={{ "--weight": Math.max(category.obras, 1) } as React.CSSProperties}
                >
                  {imageUrl && (
                    <Image
                      className="shop-plate-image"
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 100vw, 50vw"
                      /* Sin `priority`: la tapa del hero es ahora la imagen
                         grande del primer viewport, y tres candidatas a LCP
                         compitiendo la retrasaban. El muro queda a un scroll,
                         que es dentro del margen con que el navegador dispara
                         la carga diferida. */
                      quality={85}
                    />
                  )}

                  <span className="shop-plate-body">
                    <span className="shop-plate-spine">
                      <span className="shop-plate-name">{category.name}</span>
                      <span className="shop-plate-count">
                        {category.obras} {category.obras === 1 ? "work" : "works"} ·{" "}
                        {category.paises} {category.paises === 1 ? "country" : "countries"}
                      </span>
                    </span>

                    {line && <span className="shop-plate-line">{line}</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
