import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { cleanTitle, titleNamesPlace } from "@/lib/place";
import type { PhotoDetailRow } from "@/types/PhotoType";

export type HungPhoto = Omit<PhotoDetailRow, "categoryName" | "categorySlug" | "variants"> & {
  /* ancho/alto del original: 1.5 = 3:2 horizontal, 0.667 = 2:3 vertical */
  ratio: number;
  /* Solo los trae la sala de un país, donde las obras vienen de colecciones
     distintas: ahí cada cuadro tiene que saber a cuál pertenece, tanto para
     enlazar a su ficha como para decirlo en la cartela. En una sala de
     colección son los mismos para las veintiuna obras, así que no viajan por
     fila: los pone la sala. */
  categoryName?: string;
  categorySlug?: string;
};

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
   haya que recortarla, y por eso un par arranca y termina a la misma altura.
   Cada quinta obra cuelga sola. El ritmo no lo inventa la interfaz, sale del
   cuadro: un par de horizontales es una banda ancha y baja, un par de
   verticales son dos columnas altas. Es el mismo argumento que el muro de
   /shop, donde el ancho del panel es la cantidad de obras: la forma la decide
   el catalogo.

   Las paredes entraban ademas alternadamente por un lado y por el otro, y la
   segunda obra de cada par bajaba un escalon. Los dos se retiraron por
   decision del autor (2026-09-14): con obras de proporciones muy distintas
   —y mas todavia en una sala de pais, donde vienen de colecciones distintas—
   el zigzag competia con la variacion que ya traen los cuadros. Lo que quedo
   es la variacion que significa algo: el ancho, que es la forma de la obra. */
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

/* La sala sirve dos ejes del mismo archivo: una colección y un país. Lo único
   que cambia entre las dos es qué dice la cartela debajo del cuadro, y eso se
   le pasa: inferirlo de si la obra trae o no su colección haría que un dato
   que falta en la base se vea como una decisión de diseño —el país repetido
   veintiún veces— en vez de como lo que es, un hueco. */
type PlateMeta = "place" | "collection";

export default function CategoryRoom({
  roomName,
  categorySlug,
  description,
  photos,
  plateMeta = "place",
}: {
  /* El nombre de la sala: la colección o el país. Solo se lee cuando no hay
     obra que colgar, y por eso la pantalla vacía no nombra ninguno de los dos
     ejes: sirve igual a los dos. */
  roomName: string;
  categorySlug: string;
  description: string;
  photos: HungPhoto[];
  plateMeta?: PlateMeta;
}) {
  const [lead, rest] = splitStatement(description);
  const walls = hang(photos);
  let plateNumber = 0;

  return (
    <section className="category-room is-dark-room">
      {/* El cartel de sala: solo la voz del autor. La ficha de medidas y precios
          que vivia al costado se retiro por decision del autor; los tamanos se
          eligen en la ficha de cada obra, que es donde se compra. */}
      {/* Sin texto no se dibuja el cartel. La proporción se dio vuelta —cuando
          esto se escribió, diez de doce países no tenían relato; hoy solo falta
          el de China—, pero la regla no cambia: un bloque vacío entre la tapa y
          el muro es una sala con un marco colgado sin cuadro, y es mejor que la
          fotografía empiece antes. */}
      {lead && (
        <div className="room-entry">
          <div className="room-statement">
            <p className="room-statement-lead">{lead}</p>
            {rest && <p className="room-statement-rest">{rest}</p>}
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="room-empty">
          <p className="room-empty-title">{roomName} is still in the darkroom.</p>
          <p className="room-empty-body">
            These works are not published yet. The rest of the archive is already up.
          </p>
          <Link className="room-empty-link" href="/shop">
            See the rest of the archive <span aria-hidden="true">↗</span>
          </Link>
        </div>
      ) : (
        <div className="room-hang">
          {walls.map((wall, wallIndex) => (
            <div className="hang-wall" key={wallIndex} data-solo={wall.solo ? "" : undefined}>
              {wall.photos.map((photo) => {
                const imageUrl = normalizePhotoImage(photo.images);
                const title = cleanTitle(photo.name);
                /* La cartela nombra el eje que NO es el de la sala. En una
                   coleccion eso es el lugar —y solo cuando el titulo no lo
                   dijo ya—; en un pais, donde el lugar seria el mismo veintiun
                   veces, es la coleccion de la que viene la obra. */
                const place =
                  plateMeta === "collection"
                    ? photo.categoryName
                    : titleNamesPlace(title, photo.pais)
                      ? ""
                      : photo.pais;
                plateNumber += 1;

                return (
                  <Link
                    className="hang-plate"
                    key={photo.id}
                    href={`/shop/${photo.categorySlug ?? categorySlug}/${photo.slug}`}
                    style={
                      {
                        "--ratio": photo.ratio,
                        "--span": wall.solo ? soloSpan(photo.ratio) : undefined,
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
