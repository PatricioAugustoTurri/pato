/**
 * El techo de copias de una misma obra en el mismo tamaño.
 *
 * No es una restricción de existencias —no las hay, cada copia se imprime
 * cuando se vende— sino del taller: diez es lo que el autor está dispuesto a
 * imprimir de una sentada para un mismo pedido. Quien necesite más, escribe.
 *
 * Vive en su propio archivo, sin una sola dependencia, porque lo tienen que
 * leer los dos lados: el carrito, que corre en el navegador con zustand y
 * `sonner` encima, y `/api/checkout`, que corre en el servidor. Declararlo en
 * el store obligaba a la ruta a importar el carrito entero —y con él la
 * interfaz— para conocer un número.
 *
 * El del servidor es el único que de verdad lo hace cumplir. El del carrito es
 * comodidad: un navegador siempre puede mandar lo que quiera.
 */
export const MAX_PER_LINE = 10;
