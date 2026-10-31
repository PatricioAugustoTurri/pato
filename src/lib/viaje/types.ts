/**
 * El diario de viaje de Rumbo Oeste, como lo ven el panel y el sitio del viaje.
 *
 * Dos formas de lo mismo: `Admin*` es lo que edita el panel (con borradores e
 * ids de la base) y `Viaje` es lo que publica `/api/viaje` para que el sitio
 * del viaje lo lea al compilarse (solo lo publicado, sin ids internos). El
 * sitio guarda una copia de esa forma en `src/data/viaje.json`: si se cambia
 * algo acá, cambia también allá.
 */

export type EstadoPais = "por_llegar" | "en_curso" | "recorrido";
export type EstadoIngles = "sin" | "auto" | "revisado";
export type TipoMedio = "foto" | "video";

export const ESTADOS_PAIS: { value: EstadoPais; label: string }[] = [
  { value: "por_llegar", label: "Por llegar" },
  { value: "en_curso", label: "En curso" },
  { value: "recorrido", label: "Recorrido" },
];

/* ——— Panel ——— */

export type AdminParada = {
  slug: string;
  es: string;
  en: string | null;
  local: string | null;
  lat: number;
  lon: number;
};

export type AdminMedio = {
  clientId: string;
  tipo: TipoMedio;
  url: string;
  publicId: string;
  ancho: number | null;
  alto: number | null;
  duracion: number | null;
  altEs: string | null;
  altEn: string | null;
  /** Hora local en que se tomó, "HH:MM". */
  hora: string | null;
  lat: number | null;
  lon: number | null;
  camara: string | null;
  portada: boolean;
};

/** El tiempo que hizo, de Open-Meteo: temperatura (°C), código WMO, viento (km/h) y de dónde sopla (grados). */
export type Clima = { temp: number; codigo: number; viento: number; direccion: number };

export type AdminDia = {
  id: number;
  clientId: string;
  paisId: number;
  /** Días desde la salida, contando el primero como 1. */
  numero: number;
  fecha: string;
  hora: string | null;
  desde: string | null;
  hasta: string | null;
  km: number | null;
  desnivel: number | null;
  /** Dónde terminó el día. */
  lat: number | null;
  lon: number | null;
  /** Dónde arrancó (del recorrido del GPS, si se cargó). */
  latInicio: number | null;
  lonInicio: number | null;
  /** Lo completa el servidor al guardar, con el lugar y la hora del día. */
  clima: Clima | null;
  tituloEs: string;
  textoEs: string;
  tituloEn: string | null;
  textoEn: string | null;
  enEstado: EstadoIngles;
  /** El español cambió después de la última traducción. */
  enViejo: boolean;
  publicado: boolean;
  medios: AdminMedio[];
  actualizado: string;
};

export type AdminPais = {
  id: number;
  slug: string;
  orden: number;
  es: string;
  en: string | null;
  local: string;
  localLang: string;
  estado: EstadoPais;
  cruceEs: string | null;
  cruceEn: string | null;
  resumenEs: string | null;
  resumenEn: string | null;
  paradas: AdminParada[];
};

export type EstadoSitio = {
  /** Si el panel puede pedirle a Coolify que rehaga el sitio del viaje. */
  configurado: boolean;
  /** Hay un pedido esperando o corriendo. */
  pendiente: boolean;
  ultimo: string | null;
  error: string | null;
};

export type AdminViaje = {
  paises: AdminPais[];
  dias: AdminDia[];
  sitio: EstadoSitio;
  traduce: boolean;
};

/** Lo que manda el teléfono para crear o actualizar un día. */
export type DiaPayload = Omit<AdminDia, "id" | "numero" | "enEstado" | "enViejo" | "actualizado" | "clima"> & {
  enEstado?: EstadoIngles;
};

export type PaisPayload = Omit<AdminPais, "id" | "orden" | "slug"> & { slug?: string };

/* ——— Lo publicado (lo que lee el sitio del viaje) ——— */

export type ViajeMedio = {
  tipo: TipoMedio;
  url: string;
  ancho: number | null;
  alto: number | null;
  duracion: number | null;
  alt: { es: string | null; en: string | null };
  hora: string | null;
  lat: number | null;
  lon: number | null;
  camara: string | null;
};

export type ViajeDia = {
  numero: number;
  fecha: string;
  hora: string | null;
  desde: string | null;
  hasta: string | null;
  km: number | null;
  desnivel: number | null;
  lat: number | null;
  lon: number | null;
  clima: Clima | null;
  es: { titulo: string; texto: string };
  en: { titulo: string; texto: string; revisado: boolean } | null;
  medios: ViajeMedio[];
};

export type ViajePais = {
  slug: string;
  es: string;
  en: string | null;
  local: string;
  localLang: string;
  estado: EstadoPais;
  cruce: { es: string; en: string } | null;
  resumen: { es: string | null; en: string | null };
  portada: ViajeMedio | null;
  paradas: AdminParada[];
  dias: ViajeDia[];
};

export type Viaje = {
  generado: string;
  paises: ViajePais[];
};
