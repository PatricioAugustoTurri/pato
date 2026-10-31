/**
 * El color del cielo a cada hora del día, el mismo que pinta el sitio del viaje
 * detrás de cada día del diario (`Vlog Pato/src/lib/sky.ts`, `SKY_HORA`).
 *
 * En el panel sirve para una sola cosa: que al poner la hora de un día se vea
 * el cielo con el que va a salir publicado. Si se cambia la tabla, se cambia
 * en los dos lados.
 */

export const SKY_HORA: [number, string][] = [
  [0, "#0E1030"],
  [4.5, "#141B47"],
  [5.5, "#4B3F80"],
  [6.2, "#C9707A"],
  [6.8, "#F2B79A"],
  [7.5, "#EDC1C8"],
  [8.2, "#CBC4F0"],
  [9, "#A8D0EA"],
  [12.5, "#D6EAF2"],
  [15.5, "#F0DA98"],
  [17.6, "#F2A55A"],
  [18.6, "#EC7A48"],
  [19.3, "#D9573F"],
  [19.9, "#A8344A"],
  [20.8, "#2A1A45"],
  [22, "#0E1030"],
  [24, "#0E1030"],
];

type Lab = [number, number, number];
const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function hexToLab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function labToHex([L, A, B]: Lab) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return (
    "#" +
    [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ]
      .map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(v))) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function cieloA(hora: string | null): string | null {
  const m = hora?.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]) + Number(m[2]) / 60;
  let i = 1;
  while (i < SKY_HORA.length - 1 && SKY_HORA[i][0] < h) i++;
  const [h0, c0] = SKY_HORA[i - 1];
  const [h1, c1] = SKY_HORA[i];
  const t = Math.min(1, Math.max(0, (h - h0) / (h1 - h0 || 1)));
  const a = hexToLab(c0);
  const b = hexToLab(c1);
  return labToHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

/** Ese momento del día en palabras, para que el color tenga nombre: "del amanecer". */
export function momentoDelDia(hora: string | null): string | null {
  const m = hora?.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]) + Number(m[2]) / 60;
  if (h < 5) return "de la noche";
  if (h < 6.2) return "de antes del alba";
  if (h < 8) return "del amanecer";
  if (h < 11.5) return "de la mañana";
  if (h < 14.5) return "del mediodía";
  if (h < 17.5) return "de la tarde";
  if (h < 20) return "del atardecer";
  return "de la noche";
}
