import { completar } from "@/lib/viaje/auto";
import { guardarDatosAuto, guardarTraduccion, huellaEspanol, readDia, readParadas } from "@/lib/viaje/db";
import { rehacerSitio } from "@/lib/viaje/rebuild";
import { errorClaude, traduccionDisponible, traducirDia } from "@/lib/viaje/translate";
import type { AdminDia } from "@/lib/viaje/types";

/**
 * Lo que pasa después de guardar un día: completar los lugares y el clima,
 * traducirlo si hace falta y pedir que se rehaga el sitio si cambió algo que el
 * público ve.
 *
 * Se traduce solo lo publicado, y solo si el español cambió desde la última
 * vez. Un inglés que el autor ya revisó no se pisa nunca: si el español cambió
 * después, el panel lo marca como viejo y ofrece traducir de nuevo.
 */
export async function despuesDeGuardar(
  dia: AdminDia,
  antes: { publicado: boolean } | null,
  { forzarTraduccion = false } = {},
): Promise<{ dia: AdminDia; avisoTraduccion: string | null }> {
  let avisoTraduccion: string | null = null;

  // Lugares y clima que el autor no escribió (ver auto.ts). Nunca pisa lo escrito a mano.
  const auto = await completar(dia, await readParadas()).catch(() => null);
  if (auto) {
    await guardarDatosAuto(dia.id, auto);
    dia = (await readDia(dia.id)) ?? dia;
  }

  const necesita =
    forzarTraduccion ||
    (dia.publicado && dia.enEstado !== "revisado" && (dia.enEstado === "sin" || dia.enViejo));

  if (necesita && traduccionDisponible() && (dia.tituloEs || dia.textoEs)) {
    try {
      const traduccion = await traducirDia(dia);
      await guardarTraduccion(dia.id, traduccion, huellaEspanol(dia));
      dia = (await readDia(dia.id)) ?? dia;
    } catch (error) {
      avisoTraduccion = errorClaude(error);
      console.error("[viaje] traducción:", error);
    }
  }

  if (dia.publicado || antes?.publicado) rehacerSitio();
  return { dia, avisoTraduccion };
}
