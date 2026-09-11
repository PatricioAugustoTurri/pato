import { Images, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminPhoto } from "./types";

type PhotosListProps = {
  photos: AdminPhoto[];
  onSelect: (photo: AdminPhoto) => void;
  onCreate: () => void;
  onDelete: (photo: AdminPhoto) => void;
};

function getImageUrl(images: unknown): string {
  if (!Array.isArray(images)) return "";
  const first = images[0];
  if (typeof first === "string") return first;
  if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  if (typeof first === "object" && first !== null && "url" in first && typeof first.url === "string") {
    return first.url;
  }
  return "";
}

export default function PhotosList({ photos, onSelect, onCreate, onDelete }: PhotosListProps) {
  return (
    <section className="admin-library">
      <div className="admin-library-heading">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h2>Tus fotografías</h2>
        </div>
        <Button type="button" className="admin-new-photo" onClick={onCreate}>
          <Images aria-hidden="true" /> Nueva fotografía
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="admin-empty">Todavía no hay fotografías cargadas.</p>
      ) : (
        <div className="admin-photo-grid">
          {photos.map((photo) => {
            const imageUrl = getImageUrl(photo.images);
            return (
              <div className="admin-photo-card" key={photo.id}>
                <button
                  type="button"
                  className="contents"
                  onClick={() => onSelect(photo)}
                  aria-label={`Editar ${photo.name}`}
                >
                  <div
                    className="admin-photo-card-image"
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  />
                  <span className="admin-photo-card-content">
                    <strong>{photo.name}</strong>
                    <small>/{photo.slug}</small>
                    <Pencil aria-hidden="true" />
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="admin-photo-card-delete"
                  aria-label={`Eliminar ${photo.name}`}
                  onClick={() => onDelete(photo)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}