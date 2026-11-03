"use client";

import { useSyncExternalStore } from "react";

/**
 * Instalar el diario como app: ícono propio en el teléfono (o en el Dock de la
 * compu) y abre sin señal, sin pasar por el navegador.
 *
 * Chrome avisa que se puede instalar con `beforeinstallprompt`, a veces antes de
 * que el panel termine de cargar: por eso se escucha desde que se carga este
 * archivo y no desde el botón.
 */

type Aviso = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export type EstadoInstalar = "instalada" | "se-puede" | "a-mano";

let aviso: Aviso | null = null;
let instalada = false;
const listeners = new Set<() => void>();
const avisar = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    aviso = e as Aviso;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    aviso = null;
    instalada = true;
    avisar();
  });
}

const abiertaComoApp = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const leer = (): EstadoInstalar => (instalada || abiertaComoApp() ? "instalada" : aviso ? "se-puede" : "a-mano");

const suscribir = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const useInstalar = () => useSyncExternalStore(suscribir, leer, () => "instalada" as EstadoInstalar);

/** Abre el cuadro de Chrome para instalar. */
export async function instalar() {
  if (!aviso) return;
  const actual = aviso;
  aviso = null;
  await actual.prompt();
  const { outcome } = await actual.userChoice;
  if (outcome === "accepted") instalada = true;
  avisar();
}

/**
 * Que la primera visita ya alcance para abrir sin señal. Esa vez la página y sus
 * archivos llegan antes de que el service worker empiece a atender, así que no
 * quedan guardados: se le pasa la lista para que los guarde él. Antes se carga el
 * lector de .fit, que solo se pide al usarlo y si no faltaría en la ruta.
 */
export async function guardarParaSinSenal() {
  if (!("serviceWorker" in navigator) || !navigator.onLine) return;
  const registro = await navigator.serviceWorker.ready;
  await import("@garmin/fitsdk").catch(() => {});
  const urls = performance
    .getEntriesByType("resource")
    .map((r) => r.name)
    .filter((u) => new URL(u).origin === location.origin && new URL(u).pathname.startsWith("/_next/static/"));
  registro.active?.postMessage({ tipo: "guardar", urls });
}
