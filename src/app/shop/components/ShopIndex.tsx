import Image from "next/image";
import Link from "next/link";
import { normalizeCategoryImage } from "@/components/CollectionWall";
import type { CategoryRow } from "@/lib/collections";

/**
 * El indice de la sala, solo en el telefono.
 *
 * Apilado, el muro es una columna de fotografias a sangre y oscuras, igual que
 * la tapa: la ficha del hero terminaba en un filete y la primera banda
 * arrancaba debajo con el mismo ancho y la misma penumbra, asi que la tapa se
 * leia como una coleccion mas. Entre las dos va un tramo sin fotografia, solo
 * tipo: el cambio de textura es el que marca donde termina la entrada y
 * empieza la sala.
 *
 * Y es un directorio de verdad, no un adorno: las cuatro colecciones apiladas
 * ocupan cuatro pantallas, y desde aca se entra a cualquiera de un toque. Cada
 * fila lleva un cuadrito de su tapa, como una hoja de contactos.
 *
 * En la compu no existe: el muro entra entero en una pantalla y ya es su
 * propio indice.
 */
export default function ShopIndex({ categories }: { categories: CategoryRow[] }) {
  return (
    <nav className="shop-index" aria-labelledby="shop-index-title">
      <h2 className="shop-index-title" id="shop-index-title">Collections</h2>
      <ul className="shop-index-list">
        {categories.map((category) => {
          const imageUrl = normalizeCategoryImage(category.images);
          return (
            <li key={category.id}>
              <Link className="shop-index-row" href={`/shop/${category.slug}`}>
                <span className="shop-index-thumb">
                  {imageUrl && <Image src={imageUrl} alt="" fill sizes="56px" />}
                </span>
                <span className="shop-index-name">{category.name}</span>
                <span className="shop-index-count">
                  {category.obras} {category.obras === 1 ? "work" : "works"}
                </span>
                <svg className="shop-index-arrow" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
