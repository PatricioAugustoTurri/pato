"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategory } from "../../components/types";

export type CollectionDraft = { name: string; descripcion: string };

/**
 * El formulario de una colección: alta y edición con la misma forma.
 *
 * Sin `category` es un alta; con una, edita esa. Son el mismo formulario porque
 * son los mismos dos campos, y dos componentes que piden lo mismo se separan
 * solos con el tiempo hasta que uno pide algo que el otro no.
 *
 * La dirección (`slug`) no está. Se calcula del nombre al crear y después no se
 * toca: es la URL de `/shop/<colección>`, y cambiarla rompe todo enlace ya
 * compartido. El formulario la muestra para que se vea qué salió, no para
 * editarla.
 */
export default function CollectionForm({
  category,
  isSaving,
  onSubmit,
  onCancel,
}: {
  category?: AdminCategory;
  isSaving: boolean;
  onSubmit: (draft: CollectionDraft) => void;
  onCancel: () => void;
}) {
  /* Estado inicial y nada más: al pasar de editar una colección a otra, quien
     lo llama cambia la `key` y React monta un formulario nuevo con los campos
     de la nueva. Sincronizarlo con un efecto —que fue lo primero que hubo acá—
     es el camino largo para lo mismo, y de paso dibuja una vez con los datos
     viejos antes de corregirse. */
  const [name, setName] = useState(category?.name ?? "");
  const [descripcion, setDescripcion] = useState(category?.descripcion ?? "");

  return (
    <form
      className="admin-form admin-collection-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name: name.trim(), descripcion: descripcion.trim() });
      }}
    >
      <div className="admin-section-heading">
        <p className="footer-label">{category ? `Editar ${category.name}` : "Nueva colección"}</p>
        <Button type="button" variant="ghost" className="admin-close-form" onClick={onCancel}>
          <X aria-hidden="true" /> Cerrar
        </Button>
      </div>

      <div className="admin-field">
        <label htmlFor="collection-name">Nombre *</label>
        <Input
          id="collection-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Portrait"
          required
        />
        {category && <small>Dirección: /shop/{category.slug} — no cambia al renombrarla.</small>}
      </div>

      <div className="admin-field">
        <label htmlFor="collection-descripcion">Texto de la colección</label>
        <Textarea
          id="collection-descripcion"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="El relato que se lee al abrir la colección en la tienda."
        />
        <small>Se lee en /shop/{category?.slug ?? "<colección>"}. Se puede dejar vacío.</small>
      </div>

      <Button type="submit" className="admin-submit" disabled={isSaving || !name.trim()}>
        {isSaving ? "Guardando…" : category ? "Guardar cambios" : "Crear colección"}
      </Button>
    </form>
  );
}
