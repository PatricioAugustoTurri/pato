import Link from "next/link";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { getOfferPhotos, type PreferredPhoto } from "@/lib/photos";

function Pick({ photo }: { photo: PreferredPhoto }) {
  const imageUrl = normalizePhotoImage(photo.images);

  return (
    <Link className="home-pick-link" href={`/shop/${photo.categorySlug}/${photo.slug}`}>
      <span className="home-pick-frame">
        <span
          className="home-pick-image"
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
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
        <h2>La selección <i>de este mes.</i></h2>
      </div>

      <div className="home-picks" data-count={photos.length}>
        <div className="home-pick-lead">
          <Pick photo={lead} />
        </div>
        {rest.length > 0 && (
          <div className="home-pick-rest">
            {rest.map((photo) => (
              <Pick key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
