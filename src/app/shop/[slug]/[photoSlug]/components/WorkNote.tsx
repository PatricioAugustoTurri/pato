"use client";

import { useState } from "react";

/* El texto de autor va de 501 a 1.445 caracteres. En escritorio es un bloque a
   68ch que se pasa de un scroll; en un telefono son treinta lineas y novecientos
   pixeles de columna, y el visitante deja de leer mucho antes del final.

   Asi que en angosto se recorta y se abre al tocar. El parrafo entero esta
   siempre en el DOM —para el buscador y para quien copie el texto—; lo unico
   que cambia es cuanto se ve. En escritorio el CSS esconde el boton y quita el
   recorte, de modo que el estado de este componente ni se nota: la pagina que
   el usuario aprobo no cambia en nada. */
export default function WorkNote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="work-note" aria-labelledby="work-note-heading">
      <h2 id="work-note-heading">About this photograph</h2>

      <p className="work-note-body" data-expanded={expanded ? "" : undefined}>
        {text}
      </p>

      <button
        type="button"
        className="work-note-more"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls="work-note-heading"
      >
        {expanded ? "Show less" : "Read the full note"}
      </button>
    </section>
  );
}
