import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PhotoDetailsSectionProps } from "./types";

const NO_CATEGORY = "none";

export default function PhotoDetailsSection({ register, errors, categories, countries, control }: PhotoDetailsSectionProps) {
  return (
    <section className="admin-form-section">
      <p className="footer-label">Información principal</p>
      <div className="admin-grid admin-grid-two">
        <div className="admin-field">
          <label htmlFor="name">Nombre *</label>
          <Input id="name" placeholder="Atardecer en la costa" {...register("name", { required: "El nombre es obligatorio" })} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </div>
        <div className="admin-field">
          <label htmlFor="slug">Slug *</label>
          <Input id="slug" placeholder="atardecer-en-la-costa" {...register("slug", { required: "El slug es obligatorio" })} />
          {errors.slug && <span className="field-error">{errors.slug.message}</span>}
        </div>
      </div>
      <div className="admin-field">
        <label htmlFor="description">Descripción</label>
        <Textarea id="description" placeholder="Describe la fotografía..." {...register("description")} />
      </div>
      <div className="admin-grid admin-grid-two">
        <div className="admin-field">
          <label htmlFor="categoryId">Colección</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value || NO_CATEGORY}
                onValueChange={(value) => field.onChange(value === NO_CATEGORY ? "" : value)}
              >
                <SelectTrigger id="categoryId" className="admin-select">
                  <SelectValue placeholder="Sin colección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Sin colección</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <small>Una fotografía sin colección no aparece en la tienda.</small>
        </div>
        <div className="admin-field">
          <label htmlFor="pais">País</label>
          <Input id="pais" list="paises-cargados" placeholder="Vietnam" {...register("pais")} />
          {/* Sugerencias de lo ya cargado, para no terminar con "Vietnam" y
              "vietnam" como dos países distintos en la portada. */}
          <datalist id="paises-cargados">
            {countries.map((country) => <option key={country} value={country} />)}
          </datalist>
          <small>Agrupa la obra en la portada. Sin país, no aparece ahí.</small>
        </div>
      </div>
      <div className="admin-checkbox-row">
        <label className="admin-checkbox">
          <input type="checkbox" {...register("oferta")} />
          <span>Marcar como oferta</span>
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" {...register("preferidos")} />
          <span>Marcar como preferida</span>
        </label>
      </div>
    </section>
  );
}
