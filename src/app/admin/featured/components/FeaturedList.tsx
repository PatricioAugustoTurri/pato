"use client";

import { Star, Tag } from "lucide-react";
import { catalogImage } from "@/lib/cloudinary";
import { normalizePhotoImage } from "@/lib/photo-image";
import type { AdminPhoto } from "../../components/types";

export type Flag = "preferidos" | "oferta";

/* Las dos marcas, con el nombre que tienen en la portada y no el que tienen en
   la base. `preferidos` y `oferta` son columnas; lo que hay que entender acá es
   en qué franja del sitio aparece la obra. */
const FLAG_LABEL: Record<Flag, string> = {
  preferidos: "En «My best memories»",
  oferta: "En «This month's selection»",
};

export default function FeaturedList({
  groups,
  savingId,
  flag,
  onToggle,
}: {
  groups: { country: string; photos: AdminPhoto[] }[];
  savingId: number | null;
  flag: Flag;
  onToggle: (photo: AdminPhoto) => void;
}) {
  return (
    <div className="admin-collections">
      {groups.map(({ country, photos }) => {
        const marked = photos.filter((photo) => photo[flag]).length;

        return (
          <section className="admin-collection" key={country}>
            <div className="admin-collection-head">
              <div>
                <h2>{country}</h2>
                <small>
                  {photos.length === 1 ? "1 obra" : `${photos.length} obras`}
                  {" · "}
                  {marked === 0 ? "ninguna marcada" : marked === 1 ? "1 marcada" : `${marked} marcadas`}
                </small>
              </div>

              {/* La consecuencia, dicha por país y no en una nota general: con
                  `preferidos`, que haya al menos una marcada es exactamente lo
                  que decide si este país entra en la portada o no. */}
              {flag === "preferidos" && (
                <p className={`admin-featured-state${marked > 0 ? " is-on" : ""}`}>
                  {marked > 0 ? "Aparece en la portada" : "No aparece en la portada"}
                </p>
              )}
            </div>

            <div className="admin-collection-strip">
              {photos.map((photo) => {
                const imageUrl = normalizePhotoImage(photo.images);
                const isMarked = photo[flag];

                return (
                  <button
                    type="button"
                    key={photo.id}
                    className={`admin-collection-thumb${isMarked ? " is-cover" : ""}`}
                    onClick={() => onToggle(photo)}
                    disabled={savingId === photo.id}
                    aria-pressed={isMarked}
                    aria-label={`${isMarked ? "Sacar" : "Poner"} «${photo.name}» ${FLAG_LABEL[flag]}`}
                  >
                    <span
                      className="admin-collection-thumb-image"
                      style={imageUrl ? { backgroundImage: `url(${catalogImage(imageUrl, 400)})` } : undefined}
                    />
                    <span className="admin-collection-thumb-name">{photo.name}</span>
                    {isMarked && (flag === "preferidos" ? <Star aria-hidden="true" /> : <Tag aria-hidden="true" />)}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
