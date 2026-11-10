"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DIGITAL_PRICE,
  MAX_ORIGINAL_BYTES,
  megabytes,
  megapixels,
  printSizeAt300,
} from "@/lib/digital";
import type { AdminOriginal, AdminPhoto } from "./types";

/**
 * El JPG original de la obra, el que se vende como archivo digital.
 *
 * Se guarda en el momento, aparte del botón "Guardar fotografía": un archivo de
 * 30 MB tarda en subir, y atarlo al formulario obligaba a esperar para cambiar
 * una coma de la descripción. Sin original, la ficha no ofrece el archivo.
 */
export default function OriginalSection({
  photo,
  onChange,
}: {
  photo: AdminPhoto | null;
  onChange: (photoId: number, original: AdminOriginal | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!photo) {
    return (
      <section className="admin-form-section">
        <p className="footer-label">Archivo digital</p>
        <small className="admin-original-hint">
          Guardá la fotografía primero; después, al editarla, vas a poder subir el JPG original
          para venderlo como archivo digital (€{DIGITAL_PRICE}).
        </small>
      </section>
    );
  }

  const original = photo.original;

  const upload = (file: File) => {
    setError(null);

    if (!/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
      setError("Tiene que ser un JPG. Exportalo a máxima calidad y probá de nuevo.");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setError(`Pesa ${megabytes(file.size)} MB y el máximo es ${MAX_ORIGINAL_BYTES / 1024 / 1024} MB.`);
      return;
    }

    /* XMLHttpRequest y no fetch: es lo único que avisa cuánto subió, y con 30
       MB por una red de hotel hace falta ver que avanza. */
    const request = new XMLHttpRequest();
    request.open("PUT", `/api/originales/${photo.id}`);
    request.setRequestHeader("Content-Type", "image/jpeg");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setProgress(null);
      let body: (AdminOriginal & { error?: string }) | null = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        /* Un proxy que corta la subida devuelve HTML. */
      }
      if (request.status >= 200 && request.status < 300 && body) {
        onChange(photo.id, body);
      } else {
        setError(body?.error ?? `No se pudo subir (error ${request.status}).`);
      }
    };
    request.onerror = () => {
      setProgress(null);
      setError("Se cortó la subida. Revisá la conexión y probá de nuevo.");
    };
    setProgress(0);
    request.send(file);
  };

  const remove = async () => {
    if (!confirm("¿Quitar el original? La obra deja de venderse en digital.")) return;
    setError(null);
    const response = await fetch(`/api/originales/${photo.id}`, { method: "DELETE" });
    if (response.ok) {
      onChange(photo.id, null);
    } else {
      setError("No se pudo quitar el original.");
    }
  };

  return (
    <section className="admin-form-section">
      <p className="footer-label">Archivo digital · €{DIGITAL_PRICE}</p>

      {original ? (
        <div className="admin-original">
          <strong>Original cargado: se vende en digital.</strong>
          <span>
            {original.width} × {original.height} px · {megapixels(original.width, original.height)} MP ·{" "}
            {megabytes(original.bytes)} MB
          </span>
          <span>Se imprime bien hasta {printSizeAt300(original.width, original.height)} a 300 ppp.</span>
        </div>
      ) : (
        <small className="admin-original-hint">
          Sin original, la ficha no ofrece el archivo. Subí el JPG a máxima calidad (hasta{" "}
          {MAX_ORIGINAL_BYTES / 1024 / 1024} MB): es exactamente lo que va a bajar quien lo
          compre, sin la firma PT.
        </small>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,.jpg,.jpeg"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload(file);
        }}
      />

      <div className="admin-original-actions">
        <Button type="button" variant="outline" disabled={progress !== null} onClick={() => input.current?.click()}>
          {progress !== null ? `Subiendo… ${progress}%` : original ? "Reemplazar original" : "Subir original"}
        </Button>
        {original && progress === null && (
          <Button type="button" variant="ghost" onClick={remove}>
            Quitar
          </Button>
        )}
      </div>

      {progress !== null && (
        <div className="admin-original-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <span className="field-error">{error}</span>}
    </section>
  );
}
