import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PreferredPhoto } from "@/lib/photos";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { cleanTitle, titleNamesPlace } from "@/lib/place";

type AuthWallProps = {
  title: ReactNode;
  lead: string;
  /* Opcional a proposito: `getPhotosByFlag` devuelve `[]` si la base no
     responde, y una puerta de entrada no puede depender de que el catalogo
     este en pie. Sin obra, la pared es tinta plena y sigue siendo la pared. */
  photo?: PreferredPhoto;
};

/**
 * La pared de las puertas de cuenta: login y registro.
 *
 * Es el mismo reparto de dos materiales que el carrito y la ficha de obra —la
 * obra ocupa la pared, los datos viven en el mostrador—, y no una variacion
 * sobre el. El titulo apoya sobre la fotografia porque en este sitio la
 * fotografia es el fondo de todo lo demas, nunca un adorno al costado.
 */
export default function AuthWall({ title, lead, photo }: AuthWallProps) {
  const imageUrl = photo ? normalizePhotoImage(photo.images) : "";
  const hasWork = Boolean(photo && imageUrl);
  const workTitle = photo ? cleanTitle(photo.name) : "";
  /* La misma regla que la sala de coleccion y la ficha de obra: si el titulo
     ya nombra el lugar —"...in Thailand"— la cartela no lo repite. De paso
     evita mezclar idiomas, porque `pais` esta en castellano y los titulos en
     ingles. */
  const place = photo && !titleNamesPlace(workTitle, photo.pais) ? photo.pais : "";

  return (
    <div className={`auth-wall${hasWork ? "" : " is-plain"}`}>
      {hasWork && photo && (
        <Image
          src={imageUrl}
          alt={normalizePhotoAlt(photo.images, workTitle)}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 68vw"
          quality={85}
        />
      )}
      <h1>{title}</h1>
      <p>{lead}</p>
      {hasWork && photo && (
        /* El credito lleva un dato —de quien es la pared— y una salida: desde
           la puerta se puede volver a la obra que se esta mirando. */
        <p className="auth-credit">
          {place && <b>{place}</b>}
          <span>{photo.categoryName}</span>
          <Link href={`/shop/${photo.categorySlug}/${photo.slug}`}>{workTitle}</Link>
        </p>
      )}
    </div>
  );
}
