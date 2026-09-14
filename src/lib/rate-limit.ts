/**
 * Un tope de envíos para las puertas abiertas del sitio.
 *
 * El formulario de contacto, el alta en el boletín y el registro son las tres
 * direcciones que cualquiera puede golpear sin identificarse, y las tres
 * cuestan dinero o tiempo real: dos gastan la cuota de Resend y llenan la
 * casilla del autor, la tercera escribe filas en la base. Un bucle de diez
 * líneas alcanzaba para agotar los 3.000 correos del mes.
 *
 * La cuenta vive en memoria del proceso, no en la base ni en un Redis. Con un
 * solo contenedor eso es exactamente igual de efectivo y no agrega una pieza
 * que haya que pagar y vigilar. Lo que sí implica: al reiniciar el servidor la
 * cuenta arranca de cero, y el día que la tienda corra en dos instancias cada
 * una llevará la suya —o sea, el tope real se duplica—. Para el tamaño de esta
 * tienda es el intercambio correcto; si algún día deja de serlo, lo que cambia
 * es este archivo y ninguna ruta.
 *
 * La ventana es fija, no deslizante: se cuenta desde el primer envío y se
 * reinicia entera al vencer. Un atacante puede aprovechar el borde y mandar el
 * doble del tope justo en el cambio. Da igual: lo que se está defendiendo es
 * una cuota mensual de miles, no un secreto.
 */

type Window = { count: number; resetAt: number };

export type Limit = { limit: number; windowMs: number };

const windows = new Map<string, Window>();

/* Cada IP distinta deja una entrada. Sin este tope, un recorrido de miles de
   direcciones haría crecer el Map hasta que el contenedor se quede sin
   memoria: el límite dejaría de proteger para pasar a ser el problema. */
const MAX_KEYS = 10_000;

/**
 * Quién está llamando.
 *
 * Detrás del proxy del hosting la conexión viene siempre de la misma IP
 * interna, así que la del visitante hay que leerla de `x-forwarded-for`. Esa
 * cabecera la puede escribir cualquiera, o sea que el tope por IP se esquiva
 * rotándola: por eso ninguna ruta se apoya solo en él, y todas llevan además
 * un tope general que no depende de ninguna cabecera.
 */
function clientKey(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  /* Si no hay ninguna cabecera, NO se inventa una clave común. Meter a todos
     los pedidos sin identificar en el mismo cubo sería lo peor de los dos
     mundos: no frena a nadie que sepa lo que hace —cambia de cabecera y listo—
     y, el día que el proxy deje de reenviar la IP, el tercer visitante del día
     se come un "demasiados mensajes" sin haber hecho nada. Cuando no se sabe
     quién llama, manda el tope general, que no depende de ninguna cabecera. */
  return first || request.headers.get("x-real-ip")?.trim() || null;
}

function hit(key: string, { limit, windowMs }: Limit, now: number): number {
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    if (windows.size >= MAX_KEYS) {
      for (const [candidate, window] of windows) {
        if (window.resetAt <= now) windows.delete(candidate);
      }
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }

  current.count += 1;
  /* Los segundos que faltan para que se abra de nuevo, o 0 si todavía entra.
     Es lo que se le dice al cliente en `Retry-After`. */
  return current.count > limit ? Math.max(1, Math.ceil((current.resetAt - now) / 1000)) : 0;
}

/**
 * ¿Este pedido entra?
 *
 * Se cuentan **todos** los pedidos, también los que después van a fallar por
 * tener el cuerpo mal escrito: si solo contaran los válidos, mandar basura
 * saldría gratis y el tope no defendería nada.
 *
 * `perIp` es el tope de cada visitante y `forEveryone` el de la ruta entera.
 * El segundo es el que de verdad protege la cuota de Resend, porque no hay
 * cabecera que lo esquive; está puesto muy por encima del tráfico real, así
 * que un visitante honesto solo puede chocar con él mientras un ataque está
 * pasando.
 */
export function rateLimit(
  request: Request,
  scope: string,
  perIp: Limit,
  forEveryone: Limit,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  /* Los dos se cuentan siempre, incluso si el primero ya dijo que no: si el
     general solo sumara cuando el de la IP pasa, mil direcciones distintas
     mandando una vez cada una no lo moverían nunca. */
  const caller = clientKey(request);
  const byIp = caller ? hit(`${scope}:ip:${caller}`, perIp, now) : 0;
  const byRoute = hit(`${scope}:all`, forEveryone, now);
  const retryAfter = Math.max(byIp, byRoute);

  return { ok: retryAfter === 0, retryAfter };
}
