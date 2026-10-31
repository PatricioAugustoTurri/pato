import type { Clima } from "@/lib/viaje/types";

/**
 * El clima en palabras, para el panel. Los códigos son los de la OMM que devuelve
 * Open-Meteo. El sitio del viaje tiene la misma tabla, en castellano y en inglés
 * (`Vlog Pato/src/lib/clima.ts`).
 */
const CIELO: [number, string][] = [
  [0, "despejado"],
  [1, "casi despejado"],
  [2, "parcialmente nublado"],
  [3, "nublado"],
  [48, "niebla"],
  [57, "llovizna"],
  [67, "lluvia"],
  [77, "nieve"],
  [82, "chaparrones"],
  [86, "chaparrones de nieve"],
  [99, "tormenta"],
];

const VIENTOS = ["del norte", "del noreste", "del este", "del sureste", "del sur", "del suroeste", "del oeste", "del noroeste"];

export const cieloDe = (codigo: number) => CIELO.find(([max]) => codigo <= max)?.[1] ?? "";

export function climaEnPalabras(c: Clima) {
  const viento = c.viento >= 5 ? `, viento ${VIENTOS[Math.round(c.direccion / 45) % 8]} de ${c.viento} km/h` : "";
  return `${c.temp} °C, ${cieloDe(c.codigo)}${viento}`;
}
