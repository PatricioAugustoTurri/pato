/**
 * La forma de una dirección de correo, escrita una sola vez.
 *
 * Comprueba la forma, no la existencia: `algo@algo.algo`. Verificar de verdad
 * una casilla es escribirle y esperar respuesta, y eso no se hace en la
 * validación de un formulario.
 *
 * Vive acá porque la misma comprobación tiene que ocurrir en los dos lados:
 * en el navegador, para decírselo a la persona mientras escribe, y en la ruta,
 * porque un `POST` no pasa por ningún formulario. Cuando cada uno tenía la
 * suya, la del servidor se quedó sin escribir y la del boletín afirmaba en un
 * comentario una paridad que no existía.
 */
export const EMAIL_SHAPE = /^\S+@\S+\.\S+$/;

export function looksLikeEmail(value: string): boolean {
  return EMAIL_SHAPE.test(value);
}
