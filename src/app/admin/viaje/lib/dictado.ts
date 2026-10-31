"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Dictar el día en voz alta. Usa el reconocimiento de voz del navegador (en Android, el de
 * Google, el mismo del teclado): lo que se dice se escribe mientras se habla.
 *
 * Necesita señal. Sin señal el botón lo dice, y queda el micrófono del teclado, que en los
 * teléfonos nuevos dicta sin conexión.
 *
 * Chrome corta solo después de unos segundos de silencio; mientras el autor no toque
 * "Parar", se vuelve a encender, para poder pensar en voz alta sin que se apague.
 */

type Reconocedor = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const Constructor = () =>
  typeof window === "undefined"
    ? null
    : ((window as unknown as { SpeechRecognition?: new () => Reconocedor; webkitSpeechRecognition?: new () => Reconocedor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => Reconocedor }).webkitSpeechRecognition ??
      null);

export function useDictado(onFinal: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [soportado, setSoportado] = useState(false);
  const rec = useRef<Reconocedor | null>(null);
  const quiere = useRef(false);
  const final = useRef(onFinal);

  useEffect(() => {
    final.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    const id = window.setTimeout(() => setSoportado(Boolean(Constructor())), 0);
    return () => {
      window.clearTimeout(id);
      quiere.current = false;
      rec.current?.stop();
    };
  }, []);

  const parar = useCallback(() => {
    quiere.current = false;
    rec.current?.stop();
    setEscuchando(false);
    setParcial("");
  }, []);

  const empezar = useCallback(() => {
    const C = Constructor();
    if (!C) return;
    setError(null);
    const r = new C();
    r.lang = "es-AR";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interino = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final.current(res[0].transcript.trim());
        else interino += res[0].transcript;
      }
      setParcial(interino);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      quiere.current = false;
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "El navegador no tiene permiso para usar el micrófono."
          : e.error === "network"
            ? "Para dictar acá hace falta señal. Sin señal, usá el micrófono del teclado."
            : "El dictado se cortó. Probá de nuevo.",
      );
    };
    r.onend = () => {
      if (quiere.current) {
        try {
          r.start();
          return;
        } catch {
          /* ya estaba arrancando */
        }
      }
      setEscuchando(false);
      setParcial("");
    };
    rec.current = r;
    quiere.current = true;
    try {
      r.start();
      setEscuchando(true);
    } catch {
      setError("No se pudo encender el micrófono.");
    }
  }, []);

  return { soportado, escuchando, parcial, error, empezar, parar };
}
