"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AlertTriangle, CloudOff, Loader2, Check } from "lucide-react";
import AdminNav from "../components/AdminNav";
import type { AdminDia, AdminViaje, EstadoSitio } from "@/lib/viaje/types";
import { store, pedirPersistencia, type LocalDia } from "./lib/store";
import { escuchar, sincronizar, type Avance } from "./lib/sync";
import { hoy, numeroDeDia } from "./lib/geo";
import Inicio from "./components/Inicio";
import PaisVista from "./components/PaisVista";
import PaisForm from "./components/PaisForm";
import DiaEditor from "./components/DiaEditor";
import Lote, { type EstadoLote } from "./components/Lote";
import type { DiaVista } from "./components/types";
import { prepararTodos, repartir } from "./lib/aplicar";
import { ir } from "./lib/nav";

/**
 * El diario de viaje: países y días, escrito desde el teléfono en la ruta.
 *
 * Es una sola página que cambia de vista con el `#` de la dirección. Así,
 * una vez cargada, todo sigue andando sin señal: moverse entre vistas no le
 * pide nada al servidor. Los datos vienen primero de la copia guardada en el
 * teléfono y después, si hay conexión, del servidor.
 */

type Ruta =
  | { v: "inicio" }
  | { v: "pais"; id: number }
  | { v: "pais-editar"; id: number }
  | { v: "pais-nuevo" }
  | { v: "dia"; clientId: string }
  | { v: "compartido" }
  | { v: "lote" };

function leerRuta(hash: string): Ruta {
  const [, a, b, c] = hash.split("/");
  if (a === "pais" && b === "nuevo") return { v: "pais-nuevo" };
  if (a === "pais" && Number(b)) return c === "editar" ? { v: "pais-editar", id: Number(b) } : { v: "pais", id: Number(b) };
  if (a === "dia" && b) return { v: "dia", clientId: b };
  if (a === "compartido") return { v: "compartido" };
  if (a === "lote") return { v: "lote" };
  return { v: "inicio" };
}

type Datos = AdminViaje & { sube: boolean };

/* La dirección y la señal son estado del navegador, no de React: se leen como
   fuentes externas y el servidor (que no tiene ninguna de las dos) ve la
   portada con señal. */
const suscribir = (eventos: string[]) => (cb: () => void) => {
  eventos.forEach((e) => window.addEventListener(e, cb));
  return () => eventos.forEach((e) => window.removeEventListener(e, cb));
};
const porHash = suscribir(["hashchange"]);
const porSenal = suscribir(["online", "offline"]);

export default function ViajeAdminPage() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [locales, setLocales] = useState<LocalDia[]>([]);
  const hash = useSyncExternalStore(porHash, () => window.location.hash, () => "");
  const ruta = useMemo(() => leerRuta(hash), [hash]);
  const online = useSyncExternalStore(porSenal, () => navigator.onLine, () => true);
  const [avance, setAvance] = useState<Avance>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [cargaFallida, setCargaFallida] = useState(false);
  const [lote, setLote] = useState<EstadoLote>(null);
  const datosRef = useRef<Datos | null>(null);
  useEffect(() => {
    datosRef.current = datos;
  }, [datos]);

  const recargarLocales = useCallback(async () => setLocales(await store.dias()), []);

  const slugDe = useCallback(
    (paisId: number) => datosRef.current?.paises.find((p) => p.id === paisId)?.slug ?? "sin-pais",
    [],
  );
  const subir = useCallback(() => void sincronizar(slugDe), [slugDe]);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/viaje", { cache: "no-store" });
      if (response.redirected && response.url.includes("/admin/login")) {
        window.location.href = `/admin/login?callbackUrl=${encodeURIComponent("/admin/viaje")}`;
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      const fresh = (await response.json()) as Datos;
      setDatos(fresh);
      setCargaFallida(false);
      await store.guardarViaje(fresh);
    } catch {
      setCargaFallida(true);
    }
  }, []);

  /* Arranque: la copia del teléfono primero (abre al instante, con o sin
     señal), después el servidor. */
  useEffect(() => {
    void pedirPersistencia();
    void (async () => {
      if (new URLSearchParams(window.location.search).get("compartir") === "sin-instalar") {
        setAviso({
          tipo: "error",
          texto: "Para compartir desde la galería, abrí este panel una vez con señal y agregalo a la pantalla de inicio. Después volvé a compartir.",
        });
      }
      const guardado = await store.viaje().catch(() => undefined);
      if (guardado) setDatos({ sube: true, ...guardado });
      await recargarLocales();
      await cargar();
      subir();
    })();

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/viaje-sw.js", { scope: "/admin/viaje" }).catch(() => {});
    }

    const onOnline = () => {
      void cargar();
      subir();
    };
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(subir, 45_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, [cargar, recargarLocales, subir]);

  useEffect(
    () =>
      escuchar((e) => {
        if (e.tipo === "avance") setAvance(e.avance);
        if (e.tipo === "cambio") void recargarLocales();
        if (e.tipo === "guardado") {
          void recargarLocales();
          setDatos((prev) => {
            if (!prev) return prev;
            const otros = prev.dias.filter((d) => d.clientId !== e.dia.clientId);
            const next = { ...prev, sitio: e.sitio, dias: [e.dia, ...otros].sort(ordenDias) };
            void store.guardarViaje(next);
            return next;
          });
          if (e.avisoTraduccion) setAviso({ tipo: "error", texto: `Se guardó, pero no se pudo traducir: ${e.avisoTraduccion}` });
          // Los números de día dependen del primero: se piden de nuevo.
          void cargar();
        }
      }),
    [cargar, recargarLocales],
  );

  /* Lo que muestran las listas: los días del servidor con lo que haya en el
     teléfono encima (un borrador local gana, porque es más nuevo). */
  const dias = useMemo<DiaVista[]>(() => {
    const servidor = datos?.dias ?? [];
    const porId = new Map<string, DiaVista>();
    for (const d of servidor) porId.set(d.clientId, { ...d, origen: "servidor", local: null });
    for (const l of locales) {
      const enServidor = servidor.find((d) => d.clientId === l.clientId);
      porId.set(l.clientId, {
        ...(enServidor ?? {}),
        ...l,
        id: l.id ?? enServidor?.id ?? null,
        numero: 0,
        enEstado: l.enEstado ?? enServidor?.enEstado ?? "sin",
        enViejo: enServidor?.enViejo ?? false,
        actualizado: l.editado,
        origen: "telefono",
        local: l,
      } as DiaVista);
    }
    const lista = [...porId.values()];
    const fechas = lista.map((d) => d.fecha);
    return lista.map((d) => ({ ...d, numero: numeroDeDia(d.fecha, fechas) })).sort(ordenDias);
  }, [datos, locales]);

  const nuevoDia = useCallback(
    async (paisId?: number) => {
      const paises = datosRef.current?.paises ?? [];
      const enCurso = paises.find((p) => p.estado === "en_curso");
      const pais = paisId ?? enCurso?.id ?? paises[0]?.id;
      if (!pais) return;
      const dia: LocalDia = {
        clientId: crypto.randomUUID(),
        id: null,
        paisId: pais,
        fecha: hoy(),
        hora: null,
        desde: null,
        hasta: null,
        km: null,
        desnivel: null,
        lat: null,
        lon: null,
        latInicio: null,
        lonInicio: null,
        tituloEs: "",
        textoEs: "",
        tituloEn: null,
        textoEn: null,
        enEstado: "sin",
        publicado: false,
        medios: [],
        pendiente: false,
        error: null,
        editado: new Date().toISOString(),
      };
      await store.guardar(dia);
      await recargarLocales();
      ir(`#/dia/${dia.clientId}`);
    },
    [recargarLocales],
  );

  /* "Ponerte al día" y "Compartir desde Fotos": muchos archivos, un día por fecha. */
  const procesarLote = useCallback(
    async (files: File[]) => {
      const actual = datosRef.current;
      if (!actual || files.length === 0) return;
      ir("#/lote");
      setLote({ fase: "preparando", hechos: 0, total: files.length });
      const preparados = await prepararTodos(files, (hechos, total) => setLote({ fase: "preparando", hechos, total }));
      const armados = await repartir(preparados, { paises: actual.paises, servidor: actual.dias });
      await recargarLocales();
      setLote({ fase: "listo", armados, problemas: preparados.problemas });
    },
    [recargarLocales],
  );

  /* Lo que llegó del menú Compartir lo dejó el service worker en el teléfono. */
  useEffect(() => {
    if (ruta.v !== "compartido" || !datos) return;
    let vivo = true;
    void (async () => {
      const files = await store.compartidos();
      await store.vaciarCompartidos();
      if (!vivo) return;
      if (files.length === 0) ir("#/");
      else await procesarLote(files);
    })();
    return () => {
      vivo = false;
    };
  }, [ruta.v, datos, procesarLote]);

  const actualizarSitio = (sitio: EstadoSitio) => setDatos((prev) => (prev ? { ...prev, sitio } : prev));

  const pendientes = locales.filter((l) => l.pendiente && !l.error);
  const conError = locales.filter((l) => l.pendiente && l.error);

  return (
    <main className="admin-page vj">
      <AdminNav />
      <header className="vj-head">
        <h1>
          El <i>viaje.</i>
        </h1>
        <Estado
          online={online}
          pendientes={pendientes.length}
          errores={conError.length}
          avance={avance}
          dias={dias}
          sitio={datos?.sitio}
          sube={datos?.sube ?? true}
        />
      </header>

      {aviso && (
        <p className={`vj-aviso ${aviso.tipo}`} role="status">
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)}>Cerrar</button>
        </p>
      )}

      {!datos ? (
        <p className="vj-vacio">
          {cargaFallida
            ? "No se pudo cargar el viaje y no hay una copia guardada en este teléfono. Probá de nuevo con señal."
            : "Cargando el viaje…"}
        </p>
      ) : ruta.v === "inicio" ? (
        <Inicio paises={datos.paises} dias={dias} onNuevoDia={() => void nuevoDia()} onLote={(files) => void procesarLote(files)} />
      ) : ruta.v === "lote" || ruta.v === "compartido" ? (
        <Lote estado={lote} dias={dias} paises={datos.paises} />
      ) : ruta.v === "pais" ? (
        <PaisVista
          key={ruta.id}
          pais={datos.paises.find((p) => p.id === ruta.id)}
          dias={dias.filter((d) => d.paisId === ruta.id)}
          online={online}
          onNuevoDia={() => void nuevoDia(ruta.id)}
          onCambio={async () => {
            await cargar();
          }}
          onAviso={setAviso}
        />
      ) : ruta.v === "pais-editar" || ruta.v === "pais-nuevo" ? (
        <PaisForm
          key={ruta.v === "pais-editar" ? ruta.id : "nuevo"}
          pais={ruta.v === "pais-editar" ? datos.paises.find((p) => p.id === ruta.id) : undefined}
          paises={datos.paises}
          tieneDias={ruta.v === "pais-editar" && dias.some((d) => d.paisId === ruta.id)}
          online={online}
          onGuardado={async (id, texto) => {
            await cargar();
            setAviso({ tipo: "ok", texto });
            ir(id ? `#/pais/${id}` : "#/");
          }}
          onAviso={setAviso}
        />
      ) : (
        <DiaEditor
          key={ruta.clientId}
          clientId={ruta.clientId}
          servidor={datos.dias.find((d) => d.clientId === ruta.clientId) ?? null}
          paises={datos.paises}
          fechas={dias.filter((d) => d.clientId !== ruta.clientId).map((d) => d.fecha)}
          online={online}
          traduce={datos.traduce}
          onGuardar={async () => {
            await recargarLocales();
            subir();
          }}
          onBorrado={async (paisId, sitio) => {
            await recargarLocales();
            if (sitio) actualizarSitio(sitio);
            setDatos((prev) => (prev ? { ...prev, dias: prev.dias.filter((d) => d.clientId !== ruta.clientId) } : prev));
            ir(`#/pais/${paisId}`);
          }}
          onServidor={(dia: AdminDia, sitio: EstadoSitio) =>
            setDatos((prev) =>
              prev ? { ...prev, sitio, dias: prev.dias.map((d) => (d.clientId === dia.clientId ? dia : d)) } : prev,
            )
          }
          onAviso={setAviso}
        />
      )}
    </main>
  );
}

function ordenDias(a: { fecha: string; hora: string | null }, b: { fecha: string; hora: string | null }) {
  return b.fecha.localeCompare(a.fecha) || (b.hora ?? "").localeCompare(a.hora ?? "");
}

function Estado({
  online,
  pendientes,
  errores,
  avance,
  dias,
  sitio,
  sube,
}: {
  online: boolean;
  pendientes: number;
  errores: number;
  avance: Avance;
  dias: DiaVista[];
  sitio?: EstadoSitio;
  sube: boolean;
}) {
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  let icono = <Check aria-hidden="true" />;
  let texto: string;
  let tono = "ok";

  if (!online) {
    icono = <CloudOff aria-hidden="true" />;
    tono = "offline";
    texto = pendientes
      ? `Sin señal. ${plural(pendientes, "día espera", "días esperan")} para subir; salen solos cuando vuelva.`
      : "Sin señal. Lo que escribas queda guardado en este teléfono.";
  } else if (avance) {
    icono = <Loader2 aria-hidden="true" className="vj-gira" />;
    tono = "subiendo";
    const dia = dias.find((d) => d.clientId === avance.clientId);
    texto = `Subiendo ${dia ? `el día ${dia.numero}` : "un día"}: archivo ${avance.actual} de ${avance.total}.`;
  } else if (pendientes) {
    icono = <Loader2 aria-hidden="true" className="vj-gira" />;
    tono = "subiendo";
    texto = `${plural(pendientes, "día", "días")} por subir.`;
  } else if (sitio?.pendiente) {
    texto = "Todo subido. El sitio se actualiza en unos minutos.";
  } else if (sitio && !sitio.configurado) {
    texto = "Todo subido. El sitio del viaje no se actualiza solo todavía: falta configurar Coolify.";
    tono = "atencion";
  } else {
    texto = "Todo subido.";
  }

  return (
    <div className="vj-estado-grupo">
      <p className={`vj-estado ${tono}`} role="status" aria-live="polite">
        {icono}
        {texto}
      </p>
      {errores > 0 && (
        <p className="vj-estado error">
          <AlertTriangle aria-hidden="true" />
          {plural(errores, "día no se pudo subir", "días no se pudieron subir")}. Abrilo para ver qué pasó.
        </p>
      )}
      {!sube && (
        <p className="vj-estado atencion">
          <AlertTriangle aria-hidden="true" />
          Las fotos todavía no se pueden subir: falta configurar Cloudinary en el servidor.
        </p>
      )}
    </div>
  );
}
