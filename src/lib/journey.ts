/**
 * Rumbo Oeste, el viaje en bici, es la portada de patoturri.com cuando
 * RUMBO_OESTE_ORIGIN esta puesta en el build (ver next.config.ts). Entonces `/` ya
 * no es la home de la tienda sino el viaje, y la barra lo dice.
 *
 * Los enlaces al viaje son `<a>` comunes y no `<Link>`: `/` lo sirve otra app, y la
 * navegacion del lado del cliente de Next pediria ahi un payload que no existe.
 */
export const JOURNEY = process.env.NEXT_PUBLIC_RUMBO_OESTE === "1";
export const JOURNEY_LABEL = "The journey";
