import { NextResponse } from "next/server";

/**
 * El destino del menú Compartir de Android. Normalmente no llega acá: lo atiende el
 * service worker (public/viaje-sw.js), que guarda los archivos en el teléfono. Si el
 * panel todavía no se abrió nunca en este teléfono no hay service worker, y lo único que
 * se puede hacer es avisar.
 */
export function POST(request: Request) {
  return NextResponse.redirect(new URL("/admin/viaje?compartir=sin-instalar", request.url), 303);
}
