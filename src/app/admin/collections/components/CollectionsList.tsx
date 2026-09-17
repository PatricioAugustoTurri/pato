import { Check } from "lucide-react";
import { catalogImage } from "@/lib/cloudinary";
import { normalizePhotoImage } from "@/lib/photo-image";
import type { AdminCategory, AdminPhoto } from "../../components/types";

type CollectionsListProps = {
  categories: AdminCategory[];
  photos: AdminPhoto[];
  savingId: number | null;
  onSelect: (category: AdminCategory, photo: AdminPhoto) => void;
};

export default function CollectionsList({ categories, photos, savingId, onSelect }: CollectionsListProps) {
  return (
    <section className="admin-collections">
      {categories.map((category) => {
        /* Solo las obras de la colección. Poner de portada una foto de otra es
           posible contra la base, pero acá sería un accidente: la portada es lo
           que promete la colección, y prometer algo que adentro no está es la
           única forma de que esta pantalla mienta. */
        /* Comparados como texto a proposito: `pg` devuelve las columnas
           `bigint` como cadena, asi que estos ids llegan siendo "4" y no 4
           aunque los tipos digan `number`. Con `===` a secas esto funciona hoy
           por accidente y se rompe el dia que alguien los convierta. */
        const works = photos.filter(
          (photo) => String(photo.categoryId) === String(category.id),
        );
        const isSaving = savingId === category.id;

        return (
          <article className="admin-collection" key={category.id}>
            <div className="admin-collection-head">
              <div>
                <p className="eyebrow">Colección</p>
                <h2>{category.name}</h2>
                <small>
                  /shop/{category.slug} · {works.length} {works.length === 1 ? "obra" : "obras"}
                </small>
              </div>
              <div
                className="admin-collection-cover"
                style={category.cover ? { backgroundImage: `url(${catalogImage(category.cover, 500)})` } : undefined}
              >
                {!category.cover && <span>Sin portada</span>}
              </div>
            </div>

            {works.length === 0 ? (
              <p className="admin-empty">Esta colección todavía no tiene obras.</p>
            ) : (
              <div className="admin-collection-strip">
                {works.map((photo) => {
                  const imageUrl = normalizePhotoImage(photo.images);
                  const isCover = Boolean(imageUrl) && imageUrl === category.cover;

                  return (
                    <button
                      type="button"
                      key={photo.id}
                      className={`admin-collection-thumb${isCover ? " is-cover" : ""}`}
                      onClick={() => onSelect(category, photo)}
                      disabled={isSaving}
                      aria-pressed={isCover}
                      aria-label={`Poner «${photo.name}» como portada de ${category.name}`}
                    >
                      <span
                        className="admin-collection-thumb-image"
                        style={imageUrl ? { backgroundImage: `url(${catalogImage(imageUrl, 400)})` } : undefined}
                      />
                      <span className="admin-collection-thumb-name">{photo.name}</span>
                      {isCover && <Check aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
