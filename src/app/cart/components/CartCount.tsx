/* La linea mono sobre el titulo. Se dibuja SIEMPRE para que reserve su alto —
   tambien vacia, tambien en el esqueleto— porque si apareciera recien cuando
   localStorage contesta, el titulo y la lista entera saltarian.

   Su contenido, en cambio, solo aparece cuando dice algo que la lista no dice
   sola: con una sola copia, "1 PRINT · 1 WORK" es un rotulo decorativo, no un
   dato, y las obras solo se nombran cuando son menos que las copias. */

/* Espacio DURO, escrito como escape para que se vea que esta ahi a proposito.
   Un espacio comun es colapsable: el bloque se queda sin caja de linea, mide
   cero, y la ranura que veniamos a reservar se cierra igual. El `min-height:
   1lh` de `.cart-count` es el cinturon; esto es el tirador, para navegadores
   sin unidad `lh`. */
const RESERVED = "\u00a0";

export default function CartCount({ prints = 0, works = 0 }: { prints?: number; works?: number }) {
  const says = prints > 1;

  return (
    <p className="cart-count" aria-hidden={says ? undefined : true}>
      {says ? (
        <>
          {prints} prints
          {works < prints && (
            <>
              <span aria-hidden="true"> · </span>
              {works} {works === 1 ? "work" : "works"}
            </>
          )}
        </>
      ) : (
        RESERVED
      )}
    </p>
  );
}
