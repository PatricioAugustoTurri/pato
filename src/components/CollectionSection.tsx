import Link from "next/link";
import { catalogImage } from "@/lib/cloudinary";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { getOfferPhotos, type PreferredPhoto } from "@/lib/photos";

/* La obra que abre la selección se dibuja a 740 px y las otras dos a 521, así
   que no pueden pedir el mismo archivo: el ancho viaja con la obra. Van al
   doble de lo que miden, que es lo que dibuja una pantalla retina. */
function Pick({ photo, width }: { photo: PreferredPhoto; width: number }) {
  const imageUrl = normalizePhotoImage(photo.images);

  return (
    <Link className="home-pick-link" href={`/shop/${photo.categorySlug}/${photo.slug}`}>
      <span className="home-pick-frame">
        <span
          className="home-pick-image"
          style={imageUrl ? { backgroundImage: `url(${catalogImage(imageUrl, width)})` } : undefined}
          role="img"
          aria-label={normalizePhotoAlt(photo.images, photo.name)}
        />
      </span>
      <span className="home-pick-caption">
        <small>{photo.pais ? `${photo.pais} · ${photo.categoryName}` : photo.categoryName}</small>
        <span className="home-pick-name">{photo.name}</span>
      </span>
    </Link>
  );
}

export default async function CollectionSection() {
  const photos = await getOfferPhotos(3);

  // Sin obras en oferta no hay selección que mostrar.
  if (photos.length === 0) {
    return null;
  }

  // La primera obra manda: ocupa su propia columna, a la altura de las otras
  // dos juntas. Tres columnas iguales dirían que la selección no tiene un
  // primer nombre, y sí lo tiene.
  const [lead, ...rest] = photos;

  return (
    <section className="home-section home-pick" id="coleccion">
      <div className="home-pick-head">
        <h2>This month&apos;s <i>selection.</i></h2>
      </div>

      <div className="home-picks" data-count={photos.length}>
        <div className="home-pick-lead">
          <Pick photo={lead} width={1500} />
        </div>
        {rest.length > 0 && (
          <div className="home-pick-rest">
            {rest.map((photo) => (
              <Pick key={photo.id} photo={photo} width={1100} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
