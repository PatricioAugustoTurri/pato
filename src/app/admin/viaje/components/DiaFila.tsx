"use client";

import { Film } from "lucide-react";
import { cieloA } from "@/lib/viaje/cielo";
import { formatoFecha, formatoKm } from "../lib/geo";
import { miniatura } from "../lib/media";
import type { LocalMedio } from "../lib/store";
import type { DiaVista } from "./types";

type Medio = DiaVista["medios"][number];

/* Una URL por archivo y no una por render: IndexedDB devuelve un Blob nuevo
   cada vez que se relee el día, y revocar la URL vieja mientras una miniatura
   todavía la usa la deja en blanco. Se libera recién cuando el archivo subió. */
const urls = new Map<string, { size: number; url: string }>();

function urlLocal(clientId: string, archivo: Blob | null, subido: boolean): string | null {
  const previa = urls.get(clientId);
  if (subido || !archivo) {
    if (previa && subido) {
      URL.revokeObjectURL(previa.url);
      urls.delete(clientId);
    }
    return null;
  }
  if (previa && previa.size === archivo.size) return previa.url;
  if (previa) URL.revokeObjectURL(previa.url);
  const url = URL.createObjectURL(archivo);
  urls.set(clientId, { size: archivo.size, url });
  return url;
}

/** La imagen de un archivo: la de Cloudinary si ya subió, la del teléfono si no. */
export function usePrevia(medio: Medio | undefined, ancho = 480): string | null {
  if (!medio) return null;
  const archivo = "archivo" in medio ? (medio as LocalMedio).archivo : null;
  return medio.url ? (urlLocal(medio.clientId, null, true), miniatura(medio, ancho)) : urlLocal(medio.clientId, archivo, false);
}

export function estadoDia(d: DiaVista): { texto: string; tono: "ok" | "borrador" | "espera" | "error" | "local" } {
  if (d.local?.pendiente && d.local.error) return { texto: "No se pudo subir", tono: "error" };
  if (d.local?.pendiente) return { texto: d.publicado ? "Publicando…" : "Guardando…", tono: "espera" };
  if (d.local) return { texto: d.id ? "Cambios sin guardar" : "Sin guardar", tono: "local" };
  if (d.publicado) return { texto: "Publicado", tono: "ok" };
  return { texto: "Borrador", tono: "borrador" };
}

function Mini({ medio }: { medio: Medio }) {
  const src = usePrevia(medio, 200);
  return (
    <span className="vj-mini">
      {src && medio.tipo === "foto" && <img src={src} alt="" loading="lazy" />}
      {src && medio.tipo === "video" && (medio.url ? <img src={src} alt="" loading="lazy" /> : <video src={src} muted playsInline preload="metadata" />)}
      {medio.tipo === "video" && <Film aria-hidden="true" />}
    </span>
  );
}

export default function DiaFila({ dia, conPais }: { dia: DiaVista; conPais?: string }) {
  const estado = estadoDia(dia);
  const cielo = cieloA(dia.hora);
  const ruta = [dia.desde, dia.hasta].filter(Boolean).join(" → ");
  const datos = [
    formatoFecha(dia.fecha),
    dia.km !== null ? `${formatoKm(dia.km)} km` : null,
    ruta || null,
    conPais ?? null,
  ].filter(Boolean);

  return (
    <a className="vj-dia" href={`#/dia/${dia.clientId}`}>
      <span className="vj-dia-num">
        <span className="vj-cielo" style={cielo ? { background: cielo } : undefined} aria-hidden="true" />
        Día {dia.numero}
      </span>
      <span className="vj-dia-cuerpo">
        <span className="vj-dia-titulo">{dia.tituloEs || <em>Sin título</em>}</span>
        <span className="vj-dato">{datos.join(" · ")}</span>
        {dia.medios.length > 0 && (
          <span className="vj-minis">
            {dia.medios.slice(0, 5).map((m) => (
              <Mini key={m.clientId} medio={m} />
            ))}
            {dia.medios.length > 5 && <span className="vj-mas">+{dia.medios.length - 5}</span>}
          </span>
        )}
      </span>
      <span className="vj-dia-estado">
        <span className={`vj-chip ${estado.tono}`}>{estado.texto}</span>
        {dia.publicado && !dia.local && dia.enEstado === "auto" && !dia.enViejo && <span className="vj-chip suave">Inglés sin revisar</span>}
        {dia.publicado && !dia.local && dia.enViejo && <span className="vj-chip suave">Inglés viejo</span>}
      </span>
    </a>
  );
}
