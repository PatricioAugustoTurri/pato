"use client";

import { useEffect, useRef, useState } from "react";

/* La tapa como Live Photo: el momento se mueve unos segundos y vuelve a
   quedarse quieto en la fotografia. El primer cuadro del video ES la foto de
   abajo, asi que entrar no se nota; al terminar el video se funde y lo que
   queda es la misma toma fija. Despues de una pausa vuelve a empezar, y como
   arranca otra vez desde la foto, la vuelta tampoco tiene costura.

   El video es un recorte 16:10 de la tapa vertical, tomado en la franja de
   `--cover-y` de escritorio. Con `object-position` en esa misma variable, cae
   pixel sobre pixel encima de la foto (y debajo de la silueta) en toda
   pantalla de 16:10 o mas ancha. En las mas angostas el `media` del <source>
   no matchea, el navegador no baja nada y queda la foto sola. */
const REST_MS = 7000;

export default function HeroLive({ src, media }: { src: string; media: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia(media).matches) return;

    let timer: ReturnType<typeof setTimeout>;
    const play = () => {
      video.currentTime = 0;
      video.play().then(() => setLive(true)).catch(() => {});
    };
    const rest = () => {
      setLive(false);
      timer = setTimeout(play, REST_MS);
    };

    video.addEventListener("ended", rest);
    // Que la foto se revele primero; el movimiento llega cuando ya se asento.
    timer = setTimeout(play, 1400);
    return () => {
      clearTimeout(timer);
      video.removeEventListener("ended", rest);
    };
  }, [media]);

  return (
    <video
      ref={ref}
      className="hero-live"
      data-live={live || undefined}
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" media={media} />
    </video>
  );
}
