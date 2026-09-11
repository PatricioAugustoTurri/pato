import { Textarea } from "@/components/ui/textarea";
import type { PhotoFormProps } from "./types";

export default function ImagesSection({ register }: PhotoFormProps) {
  return (
    <section className="admin-form-section">
      <div className="admin-section-heading">
        <p className="footer-label">Imágenes</p>
        <span>Array JSON</span>
      </div>
      <div className="admin-field">
        <label htmlFor="images">Imágenes de la fotografía</label>
        <Textarea id="images" className="admin-json" {...register("images", { required: true })} />
        <small>{`Ejemplo: [{"url":"https://...","alt":"Descripción"}]`}</small>
      </div>
    </section>
  );
}
