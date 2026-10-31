import type { AdminDia, AdminPais } from "@/lib/viaje/types";
import { hoy, masCercano } from "./geo";
import { preparar, type Leido } from "./media";
import { esRecorrido, leerRecorrido, type Recorrido } from "./recorrido";
import { store, type LocalDia, type LocalMedio } from "./store";

/**
 * Cómo entran los archivos a un día, en un solo lugar: lo usan el editor (un día), "Ponerte
 * al día" (muchas fotos de varios días) y "Compartir desde Fotos".
 *
 * La regla es siempre la misma: lo que trae el archivo completa lo que el día todavía no
 * tiene, y nunca pisa lo que el autor ya escribió.
 */

export const deServidor = (d: AdminDia): LocalDia => ({
  ...d,
  latInicio: d.latInicio ?? null,
  lonInicio: d.lonInicio ?? null,
  medios: d.medios.map((m) => ({ ...m, archivo: null, nombre: "", estado: "listo", progreso: 1, error: null })),
  pendiente: false,
  error: null,
  editado: d.actualizado,
});

export function diaNuevo(paisId: number, fecha = hoy()): LocalDia {
  return {
    clientId: crypto.randomUUID(),
    id: null,
    paisId,
    fecha,
    hora: null,
    desde: null,
    hasta: null,
    km: null,
    desnivel: null,
    lat: null,
    lon: null,
    latInicio: null,
    lonInicio: null,
    tituloEs: "",
    textoEs: "",
    tituloEn: null,
    textoEn: null,
    enEstado: "sin",
    publicado: false,
    medios: [],
    pendiente: false,
    error: null,
    editado: new Date().toISOString(),
  };
}

export type Preparados = {
  medios: { medio: LocalMedio; leido: Leido }[];
  recorridos: Recorrido[];
  problemas: string[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const fechaDe = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const horaDe = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Prepara los archivos de a uno (en el teléfono, achicar 80 fotos juntas se queda sin memoria). */
export async function prepararTodos(files: File[], onAvance?: (hechos: number, total: number) => void): Promise<Preparados> {
  const out: Preparados = { medios: [], recorridos: [], problemas: [] };
  for (const [i, file] of files.entries()) {
    onAvance?.(i, files.length);
    if (esRecorrido(file)) {
      try {
        out.recorridos.push(await leerRecorrido(file));
      } catch (error) {
        out.problemas.push(`${file.name}: ${(error as Error).message}`);
      }
      continue;
    }
    const p = await preparar(file);
    if ("error" in p) {
      out.problemas.push(p.error);
      continue;
    }
    // Sin fecha en el EXIF (los videos, o una foto que perdió los datos), vale la del archivo:
    // en Android es la hora en que se grabó.
    if (!p.leido.fecha && file.lastModified) {
      p.leido.fecha = fechaDe(file.lastModified);
      p.leido.hora ??= horaDe(file.lastModified);
      p.medio.hora ??= p.leido.hora;
    }
    out.medios.push(p);
  }
  onAvance?.(files.length, files.length);
  return out;
}

/** Suma fotos, videos y un recorrido a un día. Devuelve el día nuevo y qué se completó solo. */
export function aplicar(
  dia: LocalDia,
  medios: { medio: LocalMedio; leido: Leido }[],
  recorrido: Recorrido | null,
  { ajustarFecha = false } = {},
): { dia: LocalDia; completado: string[] } {
  const next: LocalDia = { ...dia, medios: [...dia.medios], editado: new Date().toISOString(), error: null };
  const completado: string[] = [];
  const ordenados = [...medios].sort((a, b) => (a.medio.hora ?? "99").localeCompare(b.medio.hora ?? "99"));
  const sinFotosAntes = dia.medios.length === 0;
  next.medios.push(...ordenados.map((m) => m.medio));

  // En el editor, un día recién empezado toma la fecha de lo que se le carga primero.
  const fechaArchivo = recorrido?.fecha ?? ordenados.find((m) => m.leido.fecha)?.leido.fecha;
  if (ajustarFecha && sinFotosAntes && !dia.hora && fechaArchivo && fechaArchivo !== dia.fecha) {
    next.fecha = fechaArchivo;
    completado.push("la fecha");
  }

  if (recorrido) {
    if (next.km === null) next.km = recorrido.km;
    if (next.desnivel === null && recorrido.desnivel !== null) next.desnivel = recorrido.desnivel;
    if (!next.hora) next.hora = recorrido.hora;
    next.latInicio = recorrido.inicio.lat;
    next.lonInicio = recorrido.inicio.lon;
    next.lat = recorrido.fin.lat;
    next.lon = recorrido.fin.lon;
    completado.push("los km, el desnivel y el recorrido");
  }

  const conFecha = ordenados.map((m) => m.leido).filter((l) => l.fecha);
  if (sinFotosAntes && !dia.hora && !recorrido && conFecha[0]) {
    next.hora = conFecha[0].hora;
    completado.push("la hora");
  }
  const conGps = ordenados.map((m) => m.leido).filter((l) => l.lat !== null);
  if (next.lat === null && conGps.length) {
    next.lat = conGps[conGps.length - 1].lat;
    next.lon = conGps[conGps.length - 1].lon;
    completado.push("el lugar");
  }
  return { dia: next, completado };
}

export type Armado = { clientId: string; fecha: string; archivos: number; nuevo: boolean };

/**
 * Reparte archivos de varios días: un día por fecha. Si ya hay un día con esa fecha (en el
 * teléfono o publicado) se suman ahí; si no, se crea uno. El país sale del GPS de las fotos;
 * sin GPS, el país en curso. Los días quedan en el teléfono, sin publicar, para revisarlos.
 */
export async function repartir(
  preparados: Preparados,
  { paises, servidor }: { paises: AdminPais[]; servidor: AdminDia[] },
): Promise<Armado[]> {
  const enCurso = paises.find((p) => p.estado === "en_curso") ?? paises[0];
  const porFecha = new Map<string, { medios: Preparados["medios"]; recorrido: Recorrido | null }>();
  const grupo = (f: string) => {
    if (!porFecha.has(f)) porFecha.set(f, { medios: [], recorrido: null });
    return porFecha.get(f)!;
  };
  for (const m of preparados.medios) grupo(m.leido.fecha ?? hoy()).medios.push(m);
  for (const r of preparados.recorridos) grupo(r.fecha).recorrido = r;

  const locales = await store.dias();
  const armados: Armado[] = [];
  for (const [fecha, { medios, recorrido }] of [...porFecha.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const local = locales.find((d) => d.fecha === fecha);
    const publicado = servidor.find((d) => d.fecha === fecha);
    const base = local ?? (publicado ? deServidor(publicado) : null);
    const gps = recorrido?.fin ?? medios.map((m) => m.leido).find((l) => l.lat !== null);
    const pais = gps ? masCercano({ lat: gps.lat!, lon: gps.lon! }, paises)?.pais : undefined;
    const dia = base ?? diaNuevo((pais ?? enCurso).id, fecha);
    const { dia: lleno } = aplicar(dia, medios, recorrido);
    await store.guardar(lleno);
    armados.push({ clientId: lleno.clientId, fecha, archivos: medios.length + (recorrido ? 1 : 0), nuevo: !base });
  }
  return armados;
}
