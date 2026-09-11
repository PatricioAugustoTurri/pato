import Link from "next/link";

export default function StorySection() {
  return (
    <section className="home-section home-colophon" id="historia">
      <h2>Viajar lento.<br /><i>Mirar mejor.</i></h2>
      <div className="home-colophon-copy">
        {/* La copia anterior prometía impresión bajo demanda en papeles de
            algodón: un dato sin confirmar. Acá solo va lo que el archivo
            sostiene. */}
        <p>
          Pato Turri nace de una forma de viajar: con los ojos abiertos y la
          mochila ligera. Cada fotografía del archivo es un viaje propio — nada
          comprado, nada encargado, nada de segunda mano.
        </p>
        <Link className="text-link" href="/about">
          Conoce la historia <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
