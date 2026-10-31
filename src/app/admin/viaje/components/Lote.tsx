"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import type { AdminPais } from "@/lib/viaje/types";
import type { Armado } from "../lib/aplicar";
import DiaFila from "./DiaFila";
import type { DiaVista } from "./types";

export type EstadoLote =
  | { fase: "preparando"; hechos: number; total: number }
  | { fase: "listo"; armados: Armado[]; problemas: string[] }
  | null;

/**
 * El resultado de cargar muchos archivos juntos (o de compartirlos desde la galería): los
 * días que se armaron, uno por fecha, listos para escribirles el texto y publicarlos.
 */
export default function Lote({ estado, dias, paises }: { estado: EstadoLote; dias: DiaVista[]; paises: AdminPais[] }) {
  const nombre = (id: number) => paises.find((p) => p.id === id)?.es;

  if (!estado || estado.fase === "preparando") {
    return (
      <div className="vj-vista">
        <p className="vj-estado subiendo">
          <Loader2 aria-hidden="true" className="vj-gira" />
          {estado ? `Preparando ${Math.min(estado.hechos + 1, estado.total)} de ${estado.total}…` : "Abriendo lo que compartiste…"}
        </p>
        {estado && (
          <span className="vj-progreso-lote" role="progressbar" aria-valuenow={estado.hechos} aria-valuemin={0} aria-valuemax={estado.total}>
            <span style={{ transform: `scaleX(${estado.total ? estado.hechos / estado.total : 0})` }} />
          </span>
        )}
        <p className="vj-nota">Se leen la fecha, la hora y el lugar de cada archivo y se achican las fotos. Todo pasa en el teléfono: no hace falta señal.</p>
      </div>
    );
  }

  const armados = estado.armados.map((a) => ({ a, dia: dias.find((d) => d.clientId === a.clientId) })).filter((x) => x.dia);
  const nuevos = estado.armados.filter((a) => a.nuevo).length;

  return (
    <div className="vj-vista">
      <a className="vj-volver" href="#/">
        <ArrowLeft aria-hidden="true" /> La ruta
      </a>
      <header className="vj-pais-cabeza">
        <h2 className="vj-h2 grande">
          {armados.length === 1 ? "Listo: 1 día" : `Listo: ${armados.length} días`}
        </h2>
        <p className="vj-nota">
          {nuevos > 0 && `${nuevos === 1 ? "Se armó 1 día nuevo" : `Se armaron ${nuevos} días nuevos`}, uno por fecha. `}
          {armados.length - nuevos > 0 && `${armados.length - nuevos === 1 ? "A 1 día que ya existía se le sumaron" : `A ${armados.length - nuevos} días que ya existían se les sumaron`} los archivos. `}
          Quedaron en el teléfono sin publicar: entrá a cada uno, escribí (o dictá) lo que pasó y publicalo.
        </p>
      </header>
      {estado.problemas.map((p) => (
        <p key={p} className="vj-aviso error">
          {p}
        </p>
      ))}
      <div className="vj-lista">
        {armados.map(({ a, dia }) => (
          <DiaFila key={a.clientId} dia={dia!} conPais={`${nombre(dia!.paisId)} · ${a.archivos} ${a.archivos === 1 ? "archivo" : "archivos"}`} />
        ))}
      </div>
    </div>
  );
}
