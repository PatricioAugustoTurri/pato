"use client";

import { useRef } from "react";
import { Images, Plus } from "lucide-react";
import { ESTADOS_PAIS, type AdminPais } from "@/lib/viaje/types";
import { formatoKm } from "../lib/geo";
import DiaFila from "./DiaFila";
import type { DiaVista } from "./types";

/**
 * La portada del panel: el botón para escribir el día de hoy, lo último que se
 * escribió y la ruta entera, país por país, de este a oeste.
 */
export default function Inicio({
  paises,
  dias,
  onNuevoDia,
  onLote,
}: {
  paises: AdminPais[];
  dias: DiaVista[];
  onNuevoDia: () => void;
  onLote: (files: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const enCurso = paises.find((p) => p.estado === "en_curso");
  const ultimos = dias.slice(0, 3);
  const totalKm = dias.filter((d) => d.publicado).reduce((s, d) => s + (d.km ?? 0), 0);
  const nombre = (id: number) => paises.find((p) => p.id === id)?.es;

  return (
    <div className="vj-vista">
      <section className="vj-hoy">
        <button type="button" className="vj-boton primario grande" onClick={onNuevoDia} disabled={paises.length === 0}>
          <Plus aria-hidden="true" />
          Escribir un día{enCurso ? ` en ${enCurso.es}` : ""}
        </button>
        <label className="vj-boton vj-ponerse">
          <Images aria-hidden="true" />
          Ponerme al día: fotos de varios días
          <input
            ref={input}
            type="file"
            multiple
            accept="image/*,video/*,.fit,.gpx"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              if (input.current) input.current.value = "";
              onLote(files);
            }}
            disabled={paises.length === 0}
          />
        </label>
        <p className="vj-dato">
          {dias.length === 0
            ? "Todavía no hay días. El primero que escribas es el día 1."
            : `${dias.length} ${dias.length === 1 ? "día" : "días"}${totalKm ? ` · ${formatoKm(totalKm)} km publicados` : ""}`}
        </p>
      </section>

      {ultimos.length > 0 && (
        <section className="vj-seccion">
          <h2 className="vj-h2">Lo último</h2>
          <div className="vj-lista">
            {ultimos.map((d) => (
              <DiaFila key={d.clientId} dia={d} conPais={nombre(d.paisId)} />
            ))}
          </div>
        </section>
      )}

      <section className="vj-seccion">
        <div className="vj-seccion-cabeza">
          <h2 className="vj-h2">La ruta</h2>
          <a className="vj-boton" href="#/pais/nuevo">
            <Plus aria-hidden="true" />
            Agregar país
          </a>
        </div>
        <ol className="vj-paises">
          {paises.map((p) => {
            const propios = dias.filter((d) => d.paisId === p.id);
            const km = propios.reduce((s, d) => s + (d.km ?? 0), 0);
            const borradores = propios.filter((d) => !d.publicado || d.local).length;
            return (
              <li key={p.id}>
                <a className={`vj-pais ${p.estado}`} href={`#/pais/${p.id}`}>
                  <span className="vj-pais-local" lang={p.localLang}>
                    {p.local}
                  </span>
                  <span className="vj-pais-nombre">{p.local !== p.es ? p.es : p.en ?? ""}</span>
                  <span className="vj-dato vj-pais-cuenta">
                    {propios.length > 0
                      ? `${propios.length} ${propios.length === 1 ? "día" : "días"}${km ? ` · ${formatoKm(km)} km` : ""}${borradores ? ` · ${borradores} sin publicar` : ""}`
                      : p.paradas.map((s) => s.es).slice(0, 3).join(" · ")}
                  </span>
                  <span className={`vj-chip ${p.estado === "en_curso" ? "ok" : p.estado === "recorrido" ? "borrador" : "suave"}`}>
                    {ESTADOS_PAIS.find((e) => e.value === p.estado)?.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
