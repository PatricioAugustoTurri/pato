import type { AdminPais } from "@/lib/viaje/types";

/**
 * ¿Dónde se sacó esta foto? La parada de la ruta más cercana a su GPS.
 *
 * Las paradas son pocas y lejanas entre sí (ciudades), así que esto no
 * pretende decir el pueblo: alcanza para proponer el país y avisar cuando el
 * día está cargado en uno y las fotos son de otro.
 */

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Cercania = { pais: AdminPais; parada: string; km: number };

export function masCercano(punto: { lat: number; lon: number }, paises: AdminPais[]): Cercania | null {
  let mejor: Cercania | null = null;
  for (const pais of paises) {
    for (const parada of pais.paradas) {
      const km = distanciaKm(punto, parada);
      if (!mejor || km < mejor.km) mejor = { pais, parada: parada.es, km };
    }
  }
  // Más lejos que esto, la parada más cercana ya no dice nada útil.
  return mejor && mejor.km < 600 ? mejor : null;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fechaLarga = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fechaCorta = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
export const formatoFecha = (fecha: string, largo = false) => {
  const texto = (largo ? fechaLarga : fechaCorta).format(new Date(`${fecha}T00:00:00Z`)).replace(".", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const formatoKm = (km: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 1 }).format(km);

/** Días desde la salida: la fecha más vieja cargada es el día 1. */
export function numeroDeDia(fecha: string, fechas: string[]) {
  const primera = fechas.reduce((min, f) => (f < min ? f : min), fecha);
  return Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${primera}T00:00:00Z`)) / 86_400_000) + 1;
}
