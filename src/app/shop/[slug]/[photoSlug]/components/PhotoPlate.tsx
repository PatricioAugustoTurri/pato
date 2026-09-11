"use client";

import { ViewTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Expand, X } from "lucide-react";

/* La obra sobre campo de tinta, entera y lo mas grande que entre. La pagina de
   detalle era el unico lugar del recorrido donde la fotografia se veia MAS
   CHICA que en la sala de la que venias: 360 x 540 px dentro de una caja fija
   con paspartu, en la pantalla donde alguien decide gastar 70 euros.

   El alto lo pone el campo y el ancho sale de la proporcion real, asi que una
   3:2 apaisada y una 2:3 vertical llenan el mismo hueco sin que a ninguna haya
   que recortarla. Y es <Image>, no un background-image: en una tienda de
   fotografia la unica imagen de la pagina no puede viajar sin optimizar. */
export default function PhotoPlate({
  imageUrl,
  alt,
  ratio,
  viewTransitionName,
}: {
  imageUrl: string;
  alt: string;
  ratio: number;
  viewTransitionName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    /* Al abrir, el foco entra en la lupa y al cerrar vuelve al boton que la
       abrio: con el teclado, sin esto, el foco se queda atras del velo. */
    closeRef.current?.focus();
    const previouslyFocused = openerRef.current;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!imageUrl) {
    return (
      <div className="plate-field">
        <p className="plate-missing">This image is not available right now.</p>
      </div>
    );
  }

  const frame = (
    <figure className="plate-frame" style={{ "--ratio": ratio } as React.CSSProperties}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority
        sizes="(max-width: 900px) 92vw, 56vw"
        quality={90}
      />
    </figure>
  );

  return (
    <div className="plate-field">
      {viewTransitionName ? (
        <ViewTransition name={viewTransitionName}>{frame}</ViewTransition>
      ) : (
        frame
      )}

      <button
        type="button"
        className="plate-expand"
        ref={openerRef}
        onClick={() => setIsOpen(true)}
      >
        <Expand aria-hidden="true" />
        <span>Full size</span>
      </button>

      {isOpen && (
        <div
          className="plate-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — full size`}
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            className="plate-lightbox-close"
            ref={closeRef}
            onClick={() => setIsOpen(false)}
            aria-label="Close full size view"
          >
            <X aria-hidden="true" />
          </button>
          <div className="plate-lightbox-image" style={{ "--ratio": ratio } as React.CSSProperties}>
            <Image
              src={imageUrl}
              alt={alt}
              fill
              sizes="92vw"
              quality={92}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
