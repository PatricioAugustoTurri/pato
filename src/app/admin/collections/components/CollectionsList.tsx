import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalogImage } from "@/lib/cloudinary";
import { normalizePhotoImage } from "@/lib/photo-image";
import type { AdminCategory, AdminPhoto } from "../../components/types";

type CollectionsListProps = {
  categories: AdminCategory[];
  photos: AdminPhoto[];
  savingId: number | null;
  onSelect: (category: AdminCategory, photo: AdminPhoto) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
};

export default function CollectionsList({
  categories,
  photos,
  savingId,
  onSelect,
  onEdit,
  onDelete,
}: CollectionsListProps) {
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
                <div className="admin-collection-actions">
                  <Button type="button" variant="ghost" onClick={() => onEdit(category)}>
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                  {/* Borrar solo se ofrece si está vacía. El servidor se niega
                      igual y con el número puesto, pero un botón que siempre
                      falla para las colecciones con obra es un botón que enseña
                      a desconfiar de los botones. */}
                  {works.length === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="admin-collection-delete"
                      onClick={() => onDelete(category)}
                      disabled={isSaving}
                    >
                      <Trash2 aria-hidden="true" /> Borrar
                    </Button>
                  )}
                </div>
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
