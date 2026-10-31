import type { EstadoSitio } from "@/lib/viaje/types";

/**
 * Rehacer el sitio del viaje cuando cambia algo publicado.
 *
 * El sitio del viaje es estático: lee el diario al compilarse. Publicar un día
 * le pide a Coolify que lo vuelva a compilar, y en un par de minutos está.
 *
 * Los pedidos se juntan: subir un día con doce fotos desde la ruta son varias
 * llamadas seguidas, y cada una pidiendo un deploy dejaría a Coolify
 * compilando el mismo sitio una y otra vez. Se espera ESPERA sin cambios y
 * recién ahí se pide uno solo.
 *
 * Necesita tres variables: COOLIFY_API_URL (el panel, por ejemplo
 * https://coolify.187.127.70.109.sslip.io), COOLIFY_API_TOKEN (un token con
 * permiso de deploy, creado en Keys & Tokens) y RUMBO_OESTE_COOLIFY_UUID (el
 * uuid de la app rumbo-oeste). Sin ellas el panel guarda igual y avisa que el
 * sitio no se actualiza solo.
 */

const ESPERA = 20_000;

type Estado = { timer: ReturnType<typeof setTimeout> | null; pendiente: boolean; ultimo: string | null; error: string | null };
const globalForRebuild = globalThis as unknown as { rumboRebuild?: Estado };
const estado: Estado = (globalForRebuild.rumboRebuild ??= { timer: null, pendiente: false, ultimo: null, error: null });

const config = () => {
  const url = process.env.COOLIFY_API_URL?.replace(/\/$/, "");
  const token = process.env.COOLIFY_API_TOKEN;
  const uuid = process.env.RUMBO_OESTE_COOLIFY_UUID;
  return url && token && uuid ? { url, token, uuid } : null;
};

export function estadoSitio(): EstadoSitio {
  return { configurado: Boolean(config()), pendiente: estado.pendiente, ultimo: estado.ultimo, error: estado.error };
}

async function deploy() {
  estado.timer = null;
  const c = config();
  if (!c) {
    estado.pendiente = false;
    return;
  }
  try {
    // Coolify 4.5 pide POST (con los datos en la dirección); las versiones anteriores, GET.
    const pedir = (method: "POST" | "GET") =>
      fetch(`${c.url}/api/v1/deploy?uuid=${encodeURIComponent(c.uuid)}&force=false`, {
        method,
        headers: { Authorization: `Bearer ${c.token}` },
        signal: AbortSignal.timeout(20_000),
      });
    let response = await pedir("POST");
    if (response.status === 405) response = await pedir("GET");
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Coolify no aceptó el token (${response.status}). En Coolify → Keys & Tokens, el token tiene que tener el permiso «deploy».`,
      );
    }
    if (!response.ok) throw new Error(`Coolify contestó ${response.status}.`);
    estado.ultimo = new Date().toISOString();
    estado.error = null;
  } catch (error) {
    estado.error =
      error instanceof TypeError
        ? "No se pudo conectar con Coolify. Revisá COOLIFY_API_URL."
        : error instanceof Error
          ? error.message
          : "No se pudo pedir el deploy.";
    console.error("[viaje] no se pudo rehacer el sitio del viaje:", estado.error);
  } finally {
    estado.pendiente = false;
  }
}

/** "Actualizar el sitio ahora": sin esperar, y contesta cómo salió. */
export async function rehacerAhora(): Promise<EstadoSitio> {
  if (!config()) return estadoSitio();
  if (estado.timer) clearTimeout(estado.timer);
  estado.pendiente = true;
  await deploy();
  return estadoSitio();
}

export function rehacerSitio(): EstadoSitio {
  if (!config()) return estadoSitio();
  estado.pendiente = true;
  if (estado.timer) clearTimeout(estado.timer);
  estado.timer = setTimeout(deploy, ESPERA);
  return estadoSitio();
}
