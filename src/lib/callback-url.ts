/**
 * Acota `?callbackUrl=` a una ruta de este sitio.
 *
 * Los formularios de cuenta terminan en `window.location.href = callbackUrl`,
 * y eso no valida nada: `/login?callbackUrl=https://otro.sitio` mandaba al
 * visitante afuera justo después de escribir su contraseña, que es la pantalla
 * con más credibilidad del sitio para una suplantación. NextAuth sí valida su
 * propio `callbackUrl` —por eso el camino de Google nunca estuvo expuesto—,
 * así que esto cubre el único tramo que lo hacía a mano.
 *
 * Solo se aceptan rutas internas. `//otro.sitio` y `/\otro.sitio` empiezan con
 * barra pero son URLs absolutas para el navegador, así que se descartan.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback: string): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
