import { Input } from "@/components/ui/input";
import { CATALOG_IMAGE_PREFIX, isCatalogImageUrl } from "@/lib/cloudinary";
import type { PhotoFormProps } from "./types";

/**
 * La imagen de la obra: la dirección que devuelve Cloudinary, y nada más.
 *
 * Acá había un campo de JSON crudo donde había que escribir
 * `[{"url":"...","alt":"..."}]` a mano. Cargar una obra obligaba a acordarse de
 * un formato, y una comilla sin cerrar tiraba toda la carga. El sitio además
 * nunca usó más de una imagen por obra —`normalizePhotoImage` siempre lee la
 * primera—, así que el array solo servía para poder equivocarse.
 */
export default function ImagesSection({ register, errors }: PhotoFormProps) {
  return (
    <section className="admin-form-section">
      <p className="footer-label">Imagen</p>

      <div className="admin-field">
        <label htmlFor="imageUrl">Dirección en Cloudinary *</label>
        <Input
          id="imageUrl"
          type="url"
          placeholder={`${CATALOG_IMAGE_PREFIX}image/upload/v1699999999/mi-foto.jpg`}
          {...register("imageUrl", {
            required: "Pegá la dirección de la imagen.",
            /* Se comprueba la cuenta, no solo que parezca una URL: una
               dirección de otro origen no se ve rota, hace fallar la página
               entera de la obra cuando alguien la abre. Mejor decirlo acá. */
            validate: (value) =>
              isCatalogImageUrl(value) ||
              `La dirección tiene que empezar con ${CATALOG_IMAGE_PREFIX}`,
          })}
        />
        {errors.imageUrl && <span className="field-error">{errors.imageUrl.message}</span>}
        <small>Subí la foto a Cloudinary y pegá acá la dirección que te da.</small>
      </div>

      <div className="admin-field">
        <label htmlFor="imageAlt">Qué se ve en la foto</label>
        <Input
          id="imageAlt"
          placeholder="Un mercado nocturno bajo la lluvia"
          {...register("imageAlt")}
        />
        <small>
          Para quien no puede ver la imagen. Describí la escena, no repitas el
          título. Si lo dejás vacío se usa el título de la obra.
        </small>
      </div>
    </section>
  );
}
