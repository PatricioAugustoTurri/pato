"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { ESTADOS_PAIS, type AdminPais, type AdminParada, type PaisPayload } from "@/lib/viaje/types";
import type { Aviso } from "./types";

/**
 * Alta y edición de un país: cómo se llama en cada idioma, el cruce en barco
 * con que termina (si lo hay), su resumen y sus paradas.
 *
 * Las paradas son las que ubican al país en la ruta: la longitud de la primera
 * decide dónde entra un país nuevo, y sus coordenadas son las que se usan para
 * reconocer de dónde son las fotos.
 */

type ParadaBorrador = Omit<AdminParada, "lat" | "lon"> & { lat: string; lon: string; key: string };

const IDIOMAS = [
  ["ja", "Japonés"], ["ko", "Coreano"], ["zh", "Chino"], ["kk", "Kazajo"], ["ky", "Kirguís"], ["uz", "Uzbeko"],
  ["az", "Azerí"], ["ka", "Georgiano"], ["tr", "Turco"], ["el", "Griego"], ["it", "Italiano"], ["fr", "Francés"],
  ["es", "Castellano"], ["pt", "Portugués"], ["ru", "Ruso"], ["tg", "Tayiko"], ["tk", "Turcomano"], ["mn", "Mongol"],
  ["hy", "Armenio"], ["fa", "Persa"], ["bg", "Búlgaro"], ["sr", "Serbio"], ["hr", "Croata"], ["sl", "Esloveno"],
  ["de", "Alemán"], ["en", "Inglés"],
];

export default function PaisForm({
  pais,
  paises,
  tieneDias,
  online,
  onGuardado,
  onAviso,
}: {
  pais: AdminPais | undefined;
  paises: AdminPais[];
  tieneDias: boolean;
  online: boolean;
  onGuardado: (id: number | null, texto: string) => Promise<void>;
  onAviso: (a: Aviso) => void;
}) {
  const [form, setForm] = useState({
    es: pais?.es ?? "",
    en: pais?.en ?? "",
    local: pais?.local ?? "",
    localLang: pais?.localLang ?? "es",
    estado: pais?.estado ?? ("por_llegar" as AdminPais["estado"]),
    cruceEs: pais?.cruceEs ?? "",
    cruceEn: pais?.cruceEn ?? "",
    resumenEs: pais?.resumenEs ?? "",
    resumenEn: pais?.resumenEn ?? "",
  });
  const [paradas, setParadas] = useState<ParadaBorrador[]>(
    (pais?.paradas ?? []).map((s) => ({ ...s, lat: String(s.lat), lon: String(s.lon), key: s.slug })),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (campo: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const setParada = (key: string, campo: keyof ParadaBorrador, valor: string) =>
    setParadas((ps) => ps.map((p) => (p.key === key ? { ...p, [campo]: valor } : p)));

  const mover = (de: number, a: number) =>
    setParadas((ps) => {
      const copia = [...ps];
      const [item] = copia.splice(de, 1);
      copia.splice(a, 0, item);
      return copia;
    });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: PaisPayload = {
      ...form,
      en: form.en || null,
      cruceEs: form.cruceEs || null,
      cruceEn: form.cruceEn || null,
      resumenEs: form.resumenEs || null,
      resumenEn: form.resumenEn || null,
      paradas: paradas.map((p) => ({
        slug: p.slug,
        es: p.es,
        en: p.en || null,
        local: p.local || null,
        lat: Number(p.lat.replace(",", ".")),
        lon: Number(p.lon.replace(",", ".")),
      })),
    };
    setGuardando(true);
    try {
      const response = await fetch(pais ? `/api/admin/viaje/paises/${pais.id}` : "/api/admin/viaje/paises", {
        method: pais ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "No se pudo guardar el país.");
      await onGuardado(pais?.id ?? body.id ?? null, pais ? `${form.es} guardado.` : `${form.es} agregado a la ruta.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const reordenar = async (delta: -1 | 1) => {
    if (!pais) return;
    const ids = paises.map((p) => p.id);
    const i = ids.indexOf(pais.id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const response = await fetch("/api/admin/viaje/paises/orden", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (response.ok) await onGuardado(pais.id, delta < 0 ? `${pais.es} va antes en la ruta.` : `${pais.es} va después en la ruta.`);
    else onAviso({ tipo: "error", texto: "No se pudo cambiar el orden." });
  };

  const borrar = async () => {
    if (!pais || !window.confirm(`¿Sacar ${pais.es} de la ruta? No se puede deshacer.`)) return;
    const response = await fetch(`/api/admin/viaje/paises/${pais.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) await onGuardado(null, `${pais.es} salió de la ruta.`);
    else onAviso({ tipo: "error", texto: body.error ?? "No se pudo borrar el país." });
  };

  const posicion = pais ? paises.findIndex((p) => p.id === pais.id) : -1;

  return (
    <form className="vj-vista vj-form" onSubmit={enviar}>
      <a className="vj-volver" href={pais ? `#/pais/${pais.id}` : "#/"}>
        <ArrowLeft aria-hidden="true" /> {pais ? pais.es : "La ruta"}
      </a>
      <h2 className="vj-h2 grande">{pais ? `Editar ${pais.es}` : "Agregar un país"}</h2>

      <section className="vj-bloque">
        <div className="vj-campos dos">
          <label className="vj-campo">
            <span className="vj-etiqueta">Nombre en castellano</span>
            <input required value={form.es} onChange={set("es")} placeholder="Kirguistán" />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">En inglés</span>
            <input value={form.en} onChange={set("en")} placeholder="Kyrgyzstan" />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">En su idioma</span>
            <input value={form.local} onChange={set("local")} placeholder="Кыргызстан" lang={form.localLang} />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">Idioma</span>
            <select value={form.localLang} onChange={set("localLang")}>
              {IDIOMAS.map(([code, nombre]) => (
                <option key={code} value={code}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="vj-campo">
          <span className="vj-etiqueta">Estado</span>
          <select value={form.estado} onChange={set("estado")}>
            {ESTADOS_PAIS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="vj-bloque">
        <h3 className="vj-etiqueta fuerte">Paradas</h3>
        <p className="vj-nota">
          Las ciudades por las que pasa la ruta, de este a oeste. Las coordenadas son en grados decimales (las copiás de
          Google Maps: tocá y mantené sobre el lugar).
        </p>
        <ol className="vj-paradas">
          {paradas.map((p, i) => (
            <li key={p.key}>
              <div className="vj-campos parada">
                <label className="vj-campo">
                  <span className="vj-etiqueta">Nombre</span>
                  <input required value={p.es} onChange={(e) => setParada(p.key, "es", e.target.value)} />
                </label>
                <label className="vj-campo">
                  <span className="vj-etiqueta">En inglés</span>
                  <input value={p.en ?? ""} onChange={(e) => setParada(p.key, "en", e.target.value)} />
                </label>
                <label className="vj-campo">
                  <span className="vj-etiqueta">Local</span>
                  <input value={p.local ?? ""} onChange={(e) => setParada(p.key, "local", e.target.value)} lang={form.localLang} />
                </label>
                <label className="vj-campo">
                  <span className="vj-etiqueta">Latitud</span>
                  <input required inputMode="decimal" value={p.lat} onChange={(e) => setParada(p.key, "lat", e.target.value)} placeholder="42.875" />
                </label>
                <label className="vj-campo">
                  <span className="vj-etiqueta">Longitud</span>
                  <input required inputMode="decimal" value={p.lon} onChange={(e) => setParada(p.key, "lon", e.target.value)} placeholder="74.604" />
                </label>
              </div>
              <div className="vj-parada-acciones">
                <button type="button" className="vj-icono" onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label={`Subir ${p.es}`}>
                  <ArrowUp aria-hidden="true" />
                </button>
                <button type="button" className="vj-icono" onClick={() => mover(i, i + 1)} disabled={i === paradas.length - 1} aria-label={`Bajar ${p.es}`}>
                  <ArrowDown aria-hidden="true" />
                </button>
                <button type="button" className="vj-icono" onClick={() => setParadas((ps) => ps.filter((x) => x.key !== p.key))} aria-label={`Sacar ${p.es}`}>
                  <X aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="vj-boton"
          onClick={() => setParadas((ps) => [...ps, { key: crypto.randomUUID(), slug: "", es: "", en: null, local: null, lat: "", lon: "" }])}
        >
          <Plus aria-hidden="true" />
          Agregar parada
        </button>
      </section>

      <section className="vj-bloque">
        <h3 className="vj-etiqueta fuerte">Cruce en barco al salir</h3>
        <div className="vj-campos dos">
          <label className="vj-campo">
            <span className="vj-etiqueta">En castellano</span>
            <input value={form.cruceEs} onChange={set("cruceEs")} placeholder="Ferry por el mar Caspio · Aktau → Bakú" />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">En inglés</span>
            <input value={form.cruceEn} onChange={set("cruceEn")} placeholder="Ferry across the Caspian Sea · Aktau → Baku" />
          </label>
        </div>
      </section>

      <section className="vj-bloque">
        <h3 className="vj-etiqueta fuerte">Resumen del país</h3>
        <p className="vj-nota">Para cuando lo termines: una o dos frases que cierran el capítulo. Sale al final de su página.</p>
        <label className="vj-campo">
          <span className="vj-etiqueta">En castellano</span>
          <textarea rows={3} value={form.resumenEs} onChange={set("resumenEs")} />
        </label>
        <label className="vj-campo">
          <span className="vj-etiqueta">En inglés</span>
          <textarea rows={3} value={form.resumenEn} onChange={set("resumenEn")} />
        </label>
      </section>

      {error && <p className="vj-aviso error">{error}</p>}
      {!online && <p className="vj-nota">Sin señal: los países se guardan cuando vuelva la conexión.</p>}

      <div className="vj-barra">
        <button type="submit" className="vj-boton primario" disabled={guardando || !online}>
          {guardando ? "Guardando…" : pais ? "Guardar país" : "Agregar a la ruta"}
        </button>
      </div>

      {pais && (
        <section className="vj-bloque vj-peligro">
          <h3 className="vj-etiqueta fuerte">Lugar en la ruta</h3>
          <div className="vj-acciones">
            <button type="button" className="vj-boton" onClick={() => void reordenar(-1)} disabled={!online || posicion <= 0}>
              <ArrowUp aria-hidden="true" /> Más al este
            </button>
            <button type="button" className="vj-boton" onClick={() => void reordenar(1)} disabled={!online || posicion >= paises.length - 1}>
              <ArrowDown aria-hidden="true" /> Más al oeste
            </button>
          </div>
          {tieneDias ? (
            <p className="vj-nota">Este país tiene días cargados, así que no se puede sacar de la ruta.</p>
          ) : (
            <button type="button" className="vj-boton peligro" onClick={() => void borrar()} disabled={!online}>
              <Trash2 aria-hidden="true" /> Sacar de la ruta
            </button>
          )}
        </section>
      )}
    </form>
  );
}
