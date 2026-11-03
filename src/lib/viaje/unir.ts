import type { AdminDia, DiaPayload } from "@/lib/viaje/types";

/**
 * Juntar dos versiones de un mismo día sin perder nada.
 *
 * Pasa en dos casos, los dos por escribir sin señal en más de un lugar:
 *
 * - "fecha": llega un día nuevo con una fecha que ya tiene día (el texto se
 *   escribió en la compu y las fotos se cargaron en el teléfono). Una fecha es
 *   un solo día, así que lo que llega se suma al que ya estaba.
 * - "edicion": llega un cambio a un día que, mientras tanto, se cambió en otro
 *   lado. Reemplazarlo borraría lo que se sumó allá (fotos, sobre todo).
 *
 * La regla: lo que llega es lo más reciente y gana donde los dos tienen algo
 * distinto (título, km, lugar); las fotos se suman; el texto se suma por
 * párrafos, así lo que ya estaba no se repite y lo que se escribió en los dos
 * lados queda entero. Si algo queda repetido, se borra a mano; si algo se
 * perdiera, no habría cómo recuperarlo.
 */
export function unirDia(existente: AdminDia, entrante: DiaPayload, modo: "fecha" | "edicion"): DiaPayload {
  const conInicio = entrante.latInicio !== null && entrante.lonInicio !== null;
  const conFin = entrante.lat !== null && entrante.lon !== null;
  const edicion = modo === "edicion";

  return {
    clientId: existente.clientId,
    paisId: edicion ? entrante.paisId : existente.paisId,
    fecha: edicion ? entrante.fecha : existente.fecha,
    hora: entrante.hora ?? existente.hora,
    desde: entrante.desde ?? existente.desde,
    hasta: entrante.hasta ?? existente.hasta,
    km: entrante.km ?? existente.km,
    desnivel: entrante.desnivel ?? existente.desnivel,
    lat: conFin ? entrante.lat : existente.lat,
    lon: conFin ? entrante.lon : existente.lon,
    latInicio: conInicio ? entrante.latInicio : existente.latInicio,
    lonInicio: conInicio ? entrante.lonInicio : existente.lonInicio,
    tituloEs: entrante.tituloEs.trim() ? entrante.tituloEs : existente.tituloEs,
    textoEs: unirTexto(existente.textoEs, entrante.textoEs),
    // El inglés revisado a mano viaja solo con su propio día: en "fecha" describe otro texto.
    tituloEn: edicion ? entrante.tituloEn : null,
    textoEn: edicion ? entrante.textoEn : null,
    enEstado: edicion ? entrante.enEstado : undefined,
    // Publicar o despublicar un día es una decisión sobre ese día; un día que se suma no la cambia.
    publicado: edicion ? entrante.publicado : existente.publicado || entrante.publicado,
    medios: unirMedios(existente.medios, entrante.medios),
  };
}

const parrafos = (texto: string) =>
  texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Los párrafos de `a`, en su orden, y después los de `b` que `a` no tiene. */
export function unirTexto(a: string, b: string): string {
  if (!b.trim()) return a;
  if (!a.trim()) return b;
  const pa = parrafos(a);
  const pb = parrafos(b);
  const nuevos = pb.filter((p) => !pa.includes(p));
  if (nuevos.length === 0) return a;
  // `b` ya tenía todo lo de `a` y algo más: es la versión más larga del mismo texto.
  if (pa.every((p) => pb.includes(p))) return b;
  return [...pa, ...nuevos].join("\n\n");
}

/** Los de antes en su orden (con la versión que llega, si llega), y después los nuevos. */
function unirMedios(antes: DiaPayload["medios"], llegan: DiaPayload["medios"]): DiaPayload["medios"] {
  const porId = new Map(llegan.map((m) => [m.clientId, m]));
  const yaEstaban = new Set(antes.map((m) => m.clientId));
  const todos = [...antes.map((m) => porId.get(m.clientId) ?? m), ...llegan.filter((m) => !yaEstaban.has(m.clientId))];
  // Una sola portada: si lo que llega marcó una, esa manda.
  const portada = llegan.find((m) => m.portada) ?? todos.find((m) => m.portada);
  return todos.map((m) => ({ ...m, portada: m.clientId === portada?.clientId }));
}
