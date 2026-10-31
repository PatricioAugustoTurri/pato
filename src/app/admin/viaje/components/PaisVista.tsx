"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { ESTADOS_PAIS, type AdminPais, type EstadoPais } from "@/lib/viaje/types";
import { formatoKm } from "../lib/geo";
import DiaFila from "./DiaFila";
import type { Aviso, DiaVista } from "./types";

export default function PaisVista({
  pais,
  dias,
  online,
  onNuevoDia,
  onCambio,
  onAviso,
}: {
  pais: AdminPais | undefined;
  dias: DiaVista[];
  online: boolean;
  onNuevoDia: () => void;
  onCambio: () => Promise<void>;
  onAviso: (a: Aviso) => void;
}) {
  const [guardando, setGuardando] = useState<EstadoPais | null>(null);

  if (!pais) {
    return (
      <div className="vj-vista">
        <a className="vj-volver" href="#/">
          <ArrowLeft aria-hidden="true" /> La ruta
        </a>
        <p className="vj-vacio">Este país ya no existe.</p>
      </div>
    );
  }

  const publicados = dias.filter((d) => d.publicado);
  const km = publicados.reduce((s, d) => s + (d.km ?? 0), 0);

  const cambiarEstado = async (estado: EstadoPais) => {
    if (estado === pais.estado) return;
    setGuardando(estado);
    try {
      const response = await fetch(`/api/admin/viaje/paises/${pais.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "No se pudo cambiar el estado.");
      await onCambio();
      onAviso({
        tipo: "ok",
        texto:
          estado === "en_curso"
            ? `Ahora estás en ${pais.es}. Los días nuevos se cargan acá.`
            : `${pais.es}: ${ESTADOS_PAIS.find((e) => e.value === estado)?.label.toLowerCase()}.`,
      });
    } catch (error) {
      onAviso({ tipo: "error", texto: (error as Error).message });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="vj-vista">
      <a className="vj-volver" href="#/">
        <ArrowLeft aria-hidden="true" /> La ruta
      </a>

      <header className="vj-pais-cabeza">
        <h2>
          <span lang={pais.localLang}>{pais.local}</span>
          {pais.local !== pais.es && <span className="vj-pais-sub">{pais.es}</span>}
        </h2>
        <p className="vj-dato">
          {dias.length === 0
            ? "Sin días todavía"
            : `${dias.length} ${dias.length === 1 ? "día" : "días"} · ${publicados.length} publicados${km ? ` · ${formatoKm(km)} km` : ""}`}
        </p>
      </header>

      <fieldset className="vj-segmento" disabled={!online || guardando !== null}>
        <legend className="vj-etiqueta">Estado</legend>
        {ESTADOS_PAIS.map((e) => (
          <label key={e.value} className={pais.estado === e.value ? "activo" : undefined}>
            <input
              type="radio"
              name="estado"
              value={e.value}
              checked={pais.estado === e.value}
              onChange={() => void cambiarEstado(e.value)}
            />
            {guardando === e.value ? "Guardando…" : e.label}
          </label>
        ))}
      </fieldset>
      {!online && <p className="vj-nota">Sin señal: el estado se cambia cuando vuelva la conexión.</p>}

      <div className="vj-acciones">
        <button type="button" className="vj-boton primario" onClick={onNuevoDia}>
          <Plus aria-hidden="true" />
          Escribir un día en {pais.es}
        </button>
        <a className="vj-boton" href={`#/pais/${pais.id}/editar`}>
          <Pencil aria-hidden="true" />
          Editar país
        </a>
        {publicados.length > 0 && (
          <a className="vj-boton" href={`/ruta/${pais.slug}`} target="_blank" rel="noopener">
            <ExternalLink aria-hidden="true" />
            Ver en el sitio
          </a>
        )}
      </div>

      {dias.length > 0 ? (
        <div className="vj-lista">
          {dias.map((d) => (
            <DiaFila key={d.clientId} dia={d} />
          ))}
        </div>
      ) : (
        <p className="vj-vacio">
          Cuando escribas el primer día en {pais.es}, el país deja de decir «Todavía no llegué» en el sitio.
        </p>
      )}
    </div>
  );
}
