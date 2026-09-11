"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="cart-room is-empty is-dark-room">
      <div className="cart-note">
        <h1>
          This page did <i>not</i> load.
        </h1>
        {/* Sin detalles del error: no le dicen nada a quien esta comprando una
            copia, y el digest ya va a la consola. Un boton que reintenta. */}
        <p>Something went wrong on our side. Trying again usually settles it.</p>
        <button type="button" className="text-link" onClick={reset}>
          Try again <span aria-hidden="true">↗</span>
        </button>
      </div>
    </main>
  );
}
