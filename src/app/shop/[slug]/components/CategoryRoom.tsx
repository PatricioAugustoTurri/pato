import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { cleanTitle, titleNamesPlace } from "@/lib/place";
import type { PhotoDetailRow } from "@/types/PhotoType";

export type HungPhoto = PhotoDetailRow & {
  /* ancho/alto del original: 1.5 = 3:2 horizontal, 0.667 = 2:3 vertical */
  ratio: number;
};

export type Edition = { size: string; price: string };

/* La descripcion de coleccion es texto de autor de unos 1.100 caracteres.
   Entera y de un tiron es un muro; su primera oracion es una entrada. Se corta
   por el primer punto seguido de espacio para no partir "ee.uu." ni un decimal. */
function splitStatement(text: string): [string, string] {
  const clean = text.trim();
  const end = clean.search(/[.!?](\s|$)/);
  if (end === -1) return [clean, ""];
  return [clean.slice(0, end + 1), clean.slice(end + 1).trim()];
}

/* El colgado.

   Las obras se agrupan de a pares, y dentro de un par el ancho de cada una es
   su propia proporcion: asi las dos miden lo mismo de alto sin que a ninguna
   haya que recortarla. Cada quinta obra cuelga sola. El ritmo no lo inventa la
   interfaz, sale del cuadro: un par de horizontales es una banda ancha y baja,
   un par de verticales son dos columnas altas, y la pared siguiente entra por
   el lado contrario. Es el mismo argumento que el muro de /shop, donde el
   ancho del panel es la cantidad de obras: la forma la decide el catalogo. */
type Wall = { photos: HungPhoto[]; solo: boolean };

function hang(photos: HungPhoto[]): Wall[] {
  const walls: Wall[] = [];
  let i = 0;
  while (i < photos.length) {
    /* Cadencia de cinco: par, par, sola. Con 5 obras entra justo una vez; con
       21 entra cuatro veces y sobra una, que cuelga sola. */
    const place = walls.length % 3;
    if (place === 2 || photos.length - i === 1) {
      walls.push({ photos: [photos[i]], solo: true });
      i += 1;
    } else {
      walls.push({ photos: photos.slice(i, i + 2), solo: false });
      i += 2;
    }
  }
  return walls;
}

/* Una obra sola no puede ocupar el mismo ancho sea cual sea su forma: a 72% del
   muro, una vertical 2:3 mide una pantalla y media de alto. El ancho del hueco
   sale de la proporcion, no de una constante. */
function soloSpan(ratio: number): string {
  if (ratio >= 1.6) return "78%";
  if (ratio >= 1.2) return "70%";
  if (ratio >= 0.9) return "54%";
  return "42%";
}

export default function CategoryRoom({
  categoryName,
  categorySlug,
  description,
  photos,
  editions,
}: {
  categoryName: string;
  categorySlug: string;
  description: string;
  photos: HungPhoto[];
  editions: Edition[];
}) {
  const [lead, rest] = splitStatement(description);
  const walls = hang(photos);
  let plateNumber = 0;

  return (
    <section className="category-room is-dark-room">
      {/* El cartel de sala: la voz del autor primero, la ficha de impresion al
          costado. El precio es identico en las 41 obras del archivo, asi que se
          declara una vez para la coleccion entera en vez de repetirse debajo de
          cada fotografia, donde no distinguiria nada y competiria con la obra. */}
      <div className="room-entry">
        <div className="room-statement">
          <p className="room-statement-lead">{lead}</p>
          {rest && <p className="room-statement-rest">{rest}</p>}
        </div>

        {editions.length > 0 && (
          <aside className="room-editions">
            <h2>Every work, three sizes</h2>
            <dl>
              {editions.map((edition) => (
                <div key={edition.size}>
                  <dt>{edition.size}</dt>
                  <dd>{edition.price}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="room-empty">
          <p className="room-empty-title">This collection is still in the darkroom.</p>
          <p className="room-empty-body">
            The works in {categoryName} are not published yet. The rest of the archive
            is already up.
          </p>
          <Link className="room-empty-link" href="/shop">
            See the other collections <span aria-hidden="true">↗</span>
          </Link>
        </div>
      ) : (
        <div className="room-hang">
          {walls.map((wall, wallIndex) => (
            <div
              className="hang-wall"
              key={wallIndex}
              data-solo={wall.solo ? "" : undefined}
              /* La pared entra por un lado y la siguiente por el otro. Sin esto
                 veintiuna obras caen en la misma columna y el muro se vuelve
                 una lista. */
              data-lean={wallIndex % 2 === 0 ? "left" : "right"}
            >
              {wall.photos.map((photo, indexInWall) => {
                const imageUrl = normalizePhotoImage(photo.images);
                const title = cleanTitle(photo.name);
                /* El pais solo cuando el titulo no lo dijo ya. */
                const place = titleNamesPlace(title, photo.pais) ? "" : photo.pais;
                plateNumber += 1;

                return (
                  <Link
                    className="hang-plate"
                    key={photo.id}
                    href={`/shop/${categorySlug}/${photo.slug}`}
                    style={
                      {
                        "--ratio": photo.ratio,
                        "--span": wall.solo ? soloSpan(photo.ratio) : undefined,
                        /* La segunda obra de cada par baja un poco: es un
                           colgado, no una fila de una planilla. */
                        "--drop": !wall.solo && indexInWall === 1 ? "1" : "0",
                      } as React.CSSProperties
                    }
                  >
                    {/* El mismo `name` existe en la pagina de detalle: al abrir
                        una obra, esta crece hasta ocupar su sitio alli en vez de
                        desaparecer y reaparecer. */}
                    <ViewTransition name={`photo-${photo.id}`}>
                      <span className="hang-frame">
                        {imageUrl && (
                          <Image
                            className="hang-image"
                            src={imageUrl}
                            alt={normalizePhotoAlt(photo.images, title)}
                            fill
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 60vw, 44vw"
                            quality={90}
                          />
                        )}
                      </span>
                    </ViewTransition>

                    {/* La cartela va debajo del cuadro, nunca encima: una sala
                        no imprime el titulo sobre la obra. */}
                    <span className="hang-label">
                      <span className="hang-index">
                        {String(plateNumber).padStart(2, "0")}
                      </span>
                      <span className="hang-name">{title}</span>
                      {place && <span className="hang-place">{place}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
