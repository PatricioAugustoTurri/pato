"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Film,
  ImagePlus,
  MapPin,
  Mic,
  Pilcrow,
  RefreshCw,
  Route,
  Square,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { AdminDia, AdminPais, EstadoSitio } from "@/lib/viaje/types";
import { formatoFecha, masCercano, numeroDeDia } from "../lib/geo";
import { climaEnPalabras } from "@/lib/viaje/clima";
import { aplicar, deServidor, prepararTodos } from "../lib/aplicar";
import { useDictado } from "../lib/dictado";
import { store, type LocalDia, type LocalMedio } from "../lib/store";
import { escuchar, progresos } from "../lib/sync";
import { usePrevia } from "./DiaFila";
import type { Aviso } from "./types";

/**
 * Escribir un día. Todo lo que se toca se guarda en el teléfono al instante;
 * "Guardar" y "Publicar" lo mandan al servidor cuando haya señal.
 *
 * Las fotos van primero porque son lo primero que hay al final de un día de
 * ruta, y porque ellas traen la fecha, la hora y el lugar: cargarlas llena
 * solas la mitad de los campos de abajo.
 */

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export default function DiaEditor({
  clientId,
  servidor,
  paises,
  fechas,
  online,
  traduce,
  onGuardar,
  onBorrado,
  onServidor,
  onAviso,
}: {
  clientId: string;
  servidor: AdminDia | null;
  paises: AdminPais[];
  fechas: string[];
  online: boolean;
  traduce: boolean;
  onGuardar: () => Promise<void>;
  onBorrado: (paisId: number, sitio?: EstadoSitio) => Promise<void>;
  onServidor: (dia: AdminDia, sitio: EstadoSitio) => void;
  onAviso: (a: Aviso) => void;
}) {
  const [dia, setDia] = useState<LocalDia | null>(null);
  const [tieneLocal, setTieneLocal] = useState(false);
  const [problemas, setProblemas] = useState<string[]>([]);
  const [preparando, setPreparando] = useState(0);
  const [nota, setNota] = useState<string | null>(null);
  const [traduciendo, setTraduciendo] = useState(false);
  const recorridoInput = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const ultimo = useRef<LocalDia | null>(null);

  /* La versión del teléfono, si hay; si no, la del servidor. */
  useEffect(() => {
    let vivo = true;
    void store.dia(clientId).then((local) => {
      if (!vivo) return;
      if (local) {
        setDia(local);
        setTieneLocal(true);
      } else if (servidor) {
        setDia(deServidor(servidor));
      }
    });
    return () => {
      vivo = false;
    };
    // Solo al abrir: después manda lo que se edita acá.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  /* La subida cambia el día en el teléfono (cada archivo que termina): se relee. */
  useEffect(
    () =>
      escuchar((e) => {
        if (e.tipo === "cambio") {
          setTick((t) => t + 1);
          void store.dia(clientId).then((local) => {
            if (local && local.pendiente) setDia(local);
          });
        }
        if (e.tipo === "guardado" && e.dia.clientId === clientId) {
          setDia(deServidor(e.dia));
          setTieneLocal(false);
        }
      }),
    [clientId],
  );

  const guardarLocal = useCallback((next: LocalDia) => {
    ultimo.current = next;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (ultimo.current) void store.guardar(ultimo.current);
    }, 300);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (ultimo.current) void store.guardar(ultimo.current);
    },
    [],
  );

  const cambiar = useCallback(
    (cambio: Partial<LocalDia> | ((d: LocalDia) => Partial<LocalDia>)) => {
      setDia((prev) => {
        if (!prev) return prev;
        const parcial = typeof cambio === "function" ? cambio(prev) : cambio;
        const next: LocalDia = { ...prev, ...parcial, error: null, editado: new Date().toISOString() };
        guardarLocal(next);
        return next;
      });
      setTieneLocal(true);
    },
    [guardarLocal],
  );

  const cambiarMedio = (id: string, cambio: Partial<LocalMedio>) =>
    cambiar((d) => ({ medios: d.medios.map((m) => (m.clientId === id ? { ...m, ...cambio } : m)) }));

  const pais = paises.find((p) => p.id === dia?.paisId);
  const clima = dia?.clima ?? servidor?.clima ?? null;
  const numero = dia ? numeroDeDia(dia.fecha, [...fechas, dia.fecha]) : 0;

  /* ¿De dónde son las fotos? La parada más cercana al último GPS. */
  const sugerencia = useMemo(() => {
    const conGps = dia?.medios.filter((m) => m.lat !== null && m.lon !== null) ?? [];
    const ultimoGps = conGps[conGps.length - 1];
    if (!ultimoGps) return null;
    const cerca = masCercano({ lat: ultimoGps.lat!, lon: ultimoGps.lon! }, paises);
    return cerca && cerca.pais.id !== dia?.paisId ? cerca : null;
  }, [dia?.medios, dia?.paisId, paises]);

  const agregar = async (files: FileList | null) => {
    if (!files || !dia) return;
    const lista = [...files];
    setPreparando(lista.length);
    setProblemas([]);
    const preparados = await prepararTodos(lista);
    setPreparando(0);
    setProblemas(preparados.problemas);
    if (input.current) input.current.value = "";
    if (recorridoInput.current) recorridoInput.current.value = "";
    if (preparados.medios.length === 0 && preparados.recorridos.length === 0) return;

    cambiar((d) => {
      const { dia: lleno, completado } = aplicar(d, preparados.medios, preparados.recorridos[0] ?? null, { ajustarFecha: true });
      const fotos = preparados.medios.filter((m) => m.medio.tipo === "foto");
      if (completado.length) {
        const ultimo = completado.pop();
        setNota(`Tomé ${completado.length ? `${completado.join(", ")} y ${ultimo}` : ultimo} de lo que cargaste.`);
      } else if (fotos.length && fotos.every((m) => m.leido.lat === null)) {
        setNota("Estas fotos no traen ubicación. Activá la ubicación en la cámara del teléfono para que la tengan.");
      }
      return { ...lleno, editado: d.editado };
    });
  };

  /* Dictado: cada frase reconocida se suma al final del texto. */
  const dictado = useDictado(
    useCallback(
      (frase: string) => cambiar((d) => ({ textoEs: d.textoEs ? `${d.textoEs.replace(/\s+$/, "")} ${frase}` : frase })),
      [cambiar],
    ),
  );
  const [antesDeOrdenar, setAntesDeOrdenar] = useState<string | null>(null);
  const [ordenando, setOrdenando] = useState(false);

  const ordenar = async () => {
    if (!dia?.textoEs.trim()) return;
    dictado.parar();
    setOrdenando(true);
    try {
      const response = await fetch("/api/admin/viaje/ordenar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: dia.textoEs }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "No se pudo ordenar el texto.");
      setAntesDeOrdenar(dia.textoEs);
      cambiar({ textoEs: body.texto });
    } catch (error) {
      onAviso({ tipo: "error", texto: (error as Error).message });
    } finally {
      setOrdenando(false);
    }
  };

  const mover = (i: number, delta: -1 | 1) =>
    cambiar((d) => {
      const medios = [...d.medios];
      const j = i + delta;
      if (j < 0 || j >= medios.length) return {};
      [medios[i], medios[j]] = [medios[j], medios[i]];
      return { medios };
    });

  const enviar = async (publicado: boolean) => {
    if (!dia) return;
    if (timer.current) window.clearTimeout(timer.current);
    const next: LocalDia = { ...dia, publicado, pendiente: true, error: null, editado: new Date().toISOString() };
    ultimo.current = null;
    await store.guardar(next);
    setDia(next);
    await onGuardar();
    onAviso({
      tipo: "ok",
      texto: online
        ? publicado
          ? `Día ${numero} en camino. Sale en el sitio unos minutos después de subir.`
          : `Día ${numero} guardado como borrador.`
        : `Día ${numero} guardado en el teléfono. Se sube solo cuando haya señal.`,
    });
    window.location.hash = `#/pais/${dia.paisId}`;
  };

  const descartar = async () => {
    if (!dia) return;
    if (!window.confirm(servidor ? "¿Descartar los cambios y volver a lo que está guardado?" : "¿Borrar este día? Todavía no se subió.")) return;
    if (timer.current) window.clearTimeout(timer.current);
    ultimo.current = null;
    await store.borrar(clientId);
    if (servidor) {
      setDia(deServidor(servidor));
      setTieneLocal(false);
      await onGuardar();
    } else {
      await onBorrado(dia.paisId);
    }
  };

  const borrar = async () => {
    if (!dia || !servidor) return;
    if (!window.confirm(`¿Borrar el día ${numero}${servidor.publicado ? ", que ya está publicado" : ""}? No se puede deshacer.`)) return;
    const response = await fetch(`/api/admin/viaje/dias/${servidor.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      onAviso({ tipo: "error", texto: body.error ?? "No se pudo borrar el día." });
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    ultimo.current = null;
    await store.borrar(clientId);
    onAviso({ tipo: "ok", texto: `Día ${numero} borrado.` });
    await onBorrado(dia.paisId, body.sitio);
  };

  const traducirDeNuevo = async () => {
    if (!servidor) return;
    setTraduciendo(true);
    try {
      const response = await fetch(`/api/admin/viaje/dias/${servidor.id}/traducir`, { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "No se pudo traducir.");
      onServidor(body.dia, body.sitio);
      setDia((prev) => (prev ? { ...prev, tituloEn: body.dia.tituloEn, textoEn: body.dia.textoEn, enEstado: body.dia.enEstado, medios: prev.medios.map((m) => ({ ...m, altEn: body.dia.medios.find((x: LocalMedio) => x.clientId === m.clientId)?.altEn ?? m.altEn })) } : prev));
      onAviso({ tipo: "ok", texto: "Traducido de nuevo." });
    } catch (error) {
      onAviso({ tipo: "error", texto: (error as Error).message });
    } finally {
      setTraduciendo(false);
    }
  };

  if (!dia) {
    return (
      <div className="vj-vista">
        <a className="vj-volver" href="#/">
          <ArrowLeft aria-hidden="true" /> La ruta
        </a>
        <p className="vj-vacio">Este día no está ni en el teléfono ni en el servidor.</p>
      </div>
    );
  }

  const subiendo = dia.pendiente && !dia.error;
  const faltanSubir = dia.medios.filter((m) => !m.url).length;
  const enViejo = Boolean(servidor?.enViejo) && !tieneLocal;

  return (
    <div className="vj-vista vj-editor">
      <a className="vj-volver" href={`#/pais/${dia.paisId}`}>
        <ArrowLeft aria-hidden="true" /> {pais?.es ?? "La ruta"}
      </a>

      <header className="vj-editor-cabeza">
        <p className="vj-dato">
          {formatoFecha(dia.fecha, true)}
        </p>
        <h2>Día {numero}</h2>
        {dia.error && (
          <p className="vj-aviso error">
            <AlertTriangle aria-hidden="true" />
            No se pudo subir: {dia.error}
          </p>
        )}
        {subiendo && (
          <p className="vj-nota">
            {online
              ? `Subiendo${faltanSubir ? `: faltan ${faltanSubir} ${faltanSubir === 1 ? "archivo" : "archivos"}` : "…"}`
              : "Esperando señal para subir. Podés seguir editando."}
          </p>
        )}
      </header>

      {/* ——— Fotos y videos ——— */}
      <section className="vj-bloque">
        <div className="vj-medios">
          {dia.medios.map((m, i) => (
            <MedioTile
              key={m.clientId}
              medio={m}
              primero={i === 0}
              ultimo={i === dia.medios.length - 1}
              onMover={(delta) => mover(i, delta)}
              onCambio={(c) => cambiarMedio(m.clientId, c)}
              onPortada={() =>
                cambiar((d) => ({ medios: d.medios.map((x) => ({ ...x, portada: x.clientId === m.clientId ? !x.portada : false })) }))
              }
              onQuitar={() => cambiar((d) => ({ medios: d.medios.filter((x) => x.clientId !== m.clientId) }))}
            />
          ))}
          <label className="vj-agregar">
            <ImagePlus aria-hidden="true" />
            <span>{preparando ? `Preparando ${preparando}…` : dia.medios.length ? "Sumar fotos o videos" : "Agregar fotos y videos"}</span>
            <small>Videos de hasta un minuto · también el .fit o .gpx del día</small>
            <input
              ref={input}
              type="file"
              accept="image/*,video/*,.fit,.gpx"
              multiple
              onChange={(e) => void agregar(e.target.files)}
              disabled={preparando > 0}
            />
          </label>
        </div>
        {problemas.map((p) => (
          <p key={p} className="vj-aviso error">
            {p}
          </p>
        ))}
        {nota && <p className="vj-nota">{nota}</p>}
        {sugerencia && (
          <p className="vj-sugerencia">
            <MapPin aria-hidden="true" />
            Las fotos son de cerca de {sugerencia.parada}, en {sugerencia.pais.es}.
            <button type="button" className="vj-boton chico" onClick={() => cambiar({ paisId: sugerencia.pais.id })}>
              Pasar el día a {sugerencia.pais.es}
            </button>
          </p>
        )}
      </section>

      {/* ——— El texto ——— */}
      <section className="vj-bloque">
        <label className="vj-campo">
          <span className="vj-etiqueta">Título</span>
          <input
            className="vj-titulo"
            value={dia.tituloEs}
            onChange={(e) => cambiar({ tituloEs: e.target.value })}
            placeholder="El viento en contra en el Gobi"
            maxLength={200}
          />
        </label>
        <div className="vj-campo">
          <div className="vj-texto-cabeza">
            <label className="vj-etiqueta" htmlFor="vj-texto-es">
              Lo que pasó
            </label>
            <div className="vj-texto-herramientas">
              {dictado.soportado && (
                <button
                  type="button"
                  className={`vj-boton chico${dictado.escuchando ? " grabando" : ""}`}
                  onClick={dictado.escuchando ? dictado.parar : dictado.empezar}
                  disabled={!online && !dictado.escuchando}
                  aria-pressed={dictado.escuchando}
                >
                  {dictado.escuchando ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                  {dictado.escuchando ? "Parar" : "Dictar"}
                </button>
              )}
              {traduce && (
                <button
                  type="button"
                  className="vj-boton chico"
                  onClick={() => void ordenar()}
                  disabled={!online || ordenando || !dia.textoEs.trim()}
                >
                  <Pilcrow aria-hidden="true" />
                  {ordenando ? "Ordenando…" : "Ordenar"}
                </button>
              )}
            </div>
          </div>
          <Texto
            id="vj-texto-es"
            value={dia.textoEs}
            onChange={(textoEs) => {
              setAntesDeOrdenar(null);
              cambiar({ textoEs });
            }}
            placeholder="Contalo como se lo contarías a alguien esta noche. O tocá «Dictar» y contalo en voz alta."
          />
          {dictado.escuchando && (
            <p className="vj-escuchando" aria-live="polite">
              <span className="vj-punto" aria-hidden="true" />
              {dictado.parcial || "Te escucho…"}
            </p>
          )}
          {dictado.error && <p className="vj-aviso error">{dictado.error}</p>}
          {!online && dictado.soportado && !dictado.escuchando && (
            <p className="vj-nota">Sin señal, el botón de dictar no anda: usá el micrófono del teclado.</p>
          )}
          {antesDeOrdenar !== null && (
            <p className="vj-sugerencia">
              Ordené el texto: puntuación y párrafos, sin cambiar lo que dijiste.
              <button
                type="button"
                className="vj-boton chico"
                onClick={() => {
                  cambiar({ textoEs: antesDeOrdenar });
                  setAntesDeOrdenar(null);
                }}
              >
                Deshacer
              </button>
            </p>
          )}
        </div>
      </section>

      {/* ——— Datos del día ——— */}
      <section className="vj-bloque">
        <h3 className="vj-etiqueta fuerte">Datos del día</h3>
        <div className="vj-campos dos">
          <label className="vj-campo">
            <span className="vj-etiqueta">País</span>
            <select value={dia.paisId} onChange={(e) => cambiar({ paisId: Number(e.target.value) })}>
              {paises.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.es}
                </option>
              ))}
            </select>
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">Fecha</span>
            <input type="date" required value={dia.fecha} onChange={(e) => e.target.value && cambiar({ fecha: e.target.value })} />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">Desde</span>
            <input value={dia.desde ?? ""} onChange={(e) => cambiar({ desde: e.target.value || null })} placeholder="Almaty" />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">Hasta</span>
            <input value={dia.hasta ?? ""} onChange={(e) => cambiar({ hasta: e.target.value || null })} placeholder="Bishkek" />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">Km</span>
            <input inputMode="decimal" value={dia.km ?? ""} onChange={(e) => cambiar({ km: num(e.target.value) })} placeholder="87" />
          </label>
          <label className="vj-campo">
            <span className="vj-etiqueta">Desnivel (m)</span>
            <input inputMode="numeric" value={dia.desnivel ?? ""} onChange={(e) => cambiar({ desnivel: num(e.target.value) })} placeholder="1240" />
          </label>
        </div>
        <label className="vj-boton vj-recorrido">
          <Route aria-hidden="true" />
          {dia.latInicio !== null ? "Cambiar el recorrido (.fit / .gpx)" : "Cargar el recorrido del Garmin o Wahoo (.fit / .gpx)"}
          <input ref={recorridoInput} type="file" accept=".fit,.gpx" onChange={(e) => void agregar(e.target.files)} />
        </label>
        <p className="vj-nota">
          {dia.desde || dia.hasta
            ? "Desde y hasta: si los dejás vacíos, se completan solos con el nombre del lugar al guardar."
            : "Desde y hasta se completan solos al guardar con el nombre del lugar (del recorrido o del GPS de las fotos). Si escribís algo, manda lo tuyo."}
        </p>
        {clima && (
          <p className="vj-clima">
            <CloudSun aria-hidden="true" />
            {climaEnPalabras(clima)}
          </p>
        )}
      </section>

      {/* ——— Inglés ——— */}
      <details className="vj-bloque vj-ingles" open={dia.enEstado === "auto" || enViejo}>
        <summary>
          <span className="vj-etiqueta fuerte">En inglés</span>
          <span className={`vj-chip ${dia.enEstado === "revisado" && !enViejo ? "ok" : dia.enEstado === "auto" ? "espera" : "suave"}`}>
            {enViejo ? "Viejo" : dia.enEstado === "revisado" ? "Revisado" : dia.enEstado === "auto" ? "Sin revisar" : "Todavía no"}
          </span>
        </summary>
        {dia.enEstado === "sin" ? (
          <p className="vj-nota">
            {traduce
              ? "Se traduce solo al publicar. Mientras tanto, la página en inglés muestra este día en castellano."
              : "La traducción automática no está configurada en el servidor. Podés escribir el inglés a mano acá abajo."}
          </p>
        ) : enViejo ? (
          <p className="vj-nota">Cambiaste el castellano después de traducir: el inglés quedó con la versión anterior.</p>
        ) : dia.enEstado === "auto" ? (
          <p className="vj-nota">Traducido automáticamente. Leelo y corregí lo que no suene a vos; al guardar queda como revisado.</p>
        ) : null}
        <label className="vj-campo">
          <span className="vj-etiqueta">Title</span>
          <input
            value={dia.tituloEn ?? ""}
            onChange={(e) => cambiar({ tituloEn: e.target.value || null, enEstado: "revisado" })}
            lang="en"
          />
        </label>
        <label className="vj-campo">
          <span className="vj-etiqueta">Text</span>
          <Texto value={dia.textoEn ?? ""} onChange={(textoEn) => cambiar({ textoEn: textoEn || null, enEstado: "revisado" })} lang="en" />
        </label>
        <div className="vj-acciones">
          {dia.enEstado === "auto" && !tieneLocal && (
            <button type="button" className="vj-boton" onClick={() => cambiar({ enEstado: "revisado" })}>
              Está bien así
            </button>
          )}
          {servidor?.publicado && traduce && (
            <button type="button" className="vj-boton" onClick={() => void traducirDeNuevo()} disabled={!online || traduciendo || tieneLocal}>
              <RefreshCw aria-hidden="true" className={traduciendo ? "vj-gira" : undefined} />
              {traduciendo ? "Traduciendo…" : "Traducir de nuevo"}
            </button>
          )}
        </div>
        {tieneLocal && servidor?.publicado && traduce && <p className="vj-nota">Guardá primero para poder traducir de nuevo.</p>}
      </details>

      {/* ——— Guardar ——— */}
      <div className="vj-barra fija">
        {dia.publicado && servidor?.publicado ? (
          <>
            <button type="button" className="vj-boton" onClick={() => void enviar(false)}>
              Pasar a borrador
            </button>
            <button type="button" className="vj-boton primario" onClick={() => void enviar(true)} disabled={!tieneLocal && !dia.error}>
              Guardar cambios
            </button>
          </>
        ) : (
          <>
            <button type="button" className="vj-boton" onClick={() => void enviar(false)}>
              Guardar borrador
            </button>
            <button type="button" className="vj-boton primario" onClick={() => void enviar(true)}>
              Publicar
            </button>
          </>
        )}
      </div>

      <div className="vj-acciones vj-peligro">
        {tieneLocal && (
          <button type="button" className="vj-boton" onClick={() => void descartar()}>
            <X aria-hidden="true" />
            {servidor ? "Descartar cambios" : "Descartar este día"}
          </button>
        )}
        {servidor && (
          <button type="button" className="vj-boton peligro" onClick={() => void borrar()} disabled={!online}>
            <Trash2 aria-hidden="true" />
            Borrar día
          </button>
        )}
      </div>
    </div>
  );
}

/** Un textarea que crece con lo que se escribe: escribir un día largo en el teléfono sin scroll adentro de un cuadro. */
function Texto({ id, value, onChange, placeholder, lang }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; lang?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 180)}px`;
  }, [value]);
  return <textarea id={id} ref={ref} className="vj-texto" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} lang={lang} />;
}

function MedioTile({
  medio,
  primero,
  ultimo,
  onMover,
  onCambio,
  onPortada,
  onQuitar,
}: {
  medio: LocalMedio;
  primero: boolean;
  ultimo: boolean;
  onMover: (delta: -1 | 1) => void;
  onCambio: (c: Partial<LocalMedio>) => void;
  onPortada: () => void;
  onQuitar: () => void;
}) {
  const src = usePrevia(medio, 640);
  const progreso = progresos.get(medio.clientId);
  const ratio = medio.ancho && medio.alto ? `${medio.ancho} / ${medio.alto}` : "4 / 5";
  const datos = [
    medio.tipo === "video" && medio.duracion ? `${Math.round(medio.duracion)} s` : null,
    medio.camara,
  ].filter(Boolean);

  return (
    <figure className={`vj-medio ${medio.estado}`}>
      <div className="vj-medio-marco" style={{ aspectRatio: ratio }}>
        {src && medio.tipo === "foto" && <img src={src} alt="" />}
        {src && medio.tipo === "video" && (medio.url ? <img src={src} alt="" /> : <video src={src} muted playsInline preload="metadata" />)}
        {medio.tipo === "video" && <Film className="vj-medio-tipo" aria-label="Video" />}
        {medio.portada && <span className="vj-medio-portada">Portada del país</span>}
        {progreso !== undefined && (
          <span className="vj-progreso" role="progressbar" aria-valuenow={Math.round(progreso * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ transform: `scaleX(${progreso})` }} />
          </span>
        )}
        {medio.estado === "error" && <span className="vj-medio-error">{medio.error ?? "No subió"}</span>}
      </div>
      <figcaption>
        {datos.length > 0 && (
          <span className="vj-dato">
            {medio.lat !== null && <MapPin aria-label="Con ubicación" />}
            {datos.join(" · ")}
          </span>
        )}
        <input
          className="vj-alt"
          value={medio.altEs ?? ""}
          onChange={(e) => onCambio({ altEs: e.target.value || null })}
          placeholder="Qué se ve (para quien no ve la foto)"
          aria-label="Descripción"
        />
        <span className="vj-medio-acciones">
          <button type="button" className="vj-icono" onClick={() => onMover(-1)} disabled={primero} aria-label="Mover antes">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="vj-icono" onClick={() => onMover(1)} disabled={ultimo} aria-label="Mover después">
            <ChevronRight aria-hidden="true" />
          </button>
          {medio.tipo === "foto" && (
            <button
              type="button"
              className={`vj-icono${medio.portada ? " activo" : ""}`}
              onClick={onPortada}
              aria-pressed={medio.portada}
              aria-label="Portada del país"
            >
              <Star aria-hidden="true" />
            </button>
          )}
          <button type="button" className="vj-icono" onClick={onQuitar} aria-label="Quitar">
            <X aria-hidden="true" />
          </button>
        </span>
      </figcaption>
    </figure>
  );
}
