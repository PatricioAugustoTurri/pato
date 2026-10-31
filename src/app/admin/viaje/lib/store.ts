import type { AdminMedio, AdminViaje, Clima, DiaPayload } from "@/lib/viaje/types";

/**
 * Lo que vive en el teléfono: los días que se están escribiendo o esperan
 * señal, con sus fotos y videos adentro, y la última copia del viaje para poder
 * abrir el panel sin conexión.
 *
 * IndexedDB y no localStorage porque guarda archivos (Blob) y no tiene el
 * límite de 5 MB: un video de un minuto entra.
 */

export type EstadoMedio = "local" | "subiendo" | "listo" | "error";

export type LocalMedio = Omit<AdminMedio, "url" | "publicId"> & {
  url: string | null;
  publicId: string | null;
  /** El archivo, hasta que termina de subir. Después se borra para no ocupar lugar. */
  archivo: Blob | null;
  nombre: string;
  estado: EstadoMedio;
  progreso: number;
  error: string | null;
};

export type LocalDia = Omit<DiaPayload, "medios"> & {
  /** Id en la base, si ya se guardó alguna vez. */
  id: number | null;
  medios: LocalMedio[];
  /** Hay que mandarlo al servidor en cuanto haya señal. */
  pendiente: boolean;
  /** El último intento falló por algo que hay que corregir (no por falta de señal). */
  error: string | null;
  editado: string;
  /** Solo para mostrar: lo completa el servidor. */
  clima?: Clima | null;
};

const DB = "rumbo-viaje";
/* La versión 2 sumó "compartidos": lo que llega desde el menú Compartir de Android lo
   guarda el service worker (public/viaje-sw.js) y el panel lo levanta al abrir. La misma
   apertura está copiada allá: si cambia acá, cambia allá. */
const VERSION = 2;

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("dias")) db.createObjectStore("dias", { keyPath: "clientId" });
      if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache");
      if (!db.objectStoreNames.contains("compartidos")) db.createObjectStore("compartidos", { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      opening = null;
      reject(req.error);
    };
  });
  return opening;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export const store = {
  dias: () => run<LocalDia[]>("dias", "readonly", (s) => s.getAll()),
  dia: (clientId: string) => run<LocalDia | undefined>("dias", "readonly", (s) => s.get(clientId)),
  guardar: (dia: LocalDia) => run("dias", "readwrite", (s) => s.put(dia)),
  borrar: (clientId: string) => run("dias", "readwrite", (s) => s.delete(clientId)),
  viaje: () => run<(AdminViaje & { sube?: boolean }) | undefined>("cache", "readonly", (s) => s.get("viaje")),
  guardarViaje: (viaje: AdminViaje) => run("cache", "readwrite", (s) => s.put(viaje, "viaje")),
  compartidos: () => run<File[]>("compartidos", "readonly", (s) => s.getAll()),
  vaciarCompartidos: () => run("compartidos", "readwrite", (s) => s.clear()),
};

/** Pide que el navegador no borre estos datos cuando le falte espacio. */
export async function pedirPersistencia() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* Si no se puede, se sigue igual: es una ayuda, no un requisito. */
  }
}
