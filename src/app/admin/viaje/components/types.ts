import type { AdminDia } from "@/lib/viaje/types";
import type { LocalDia } from "../lib/store";

/**
 * Un día como lo muestran las listas: el del servidor, o el del teléfono si
 * hay una versión local más nueva (sin guardar, esperando señal o con error).
 */
export type DiaVista = Omit<AdminDia, "id" | "medios"> & {
  id: number | null;
  medios: (AdminDia["medios"][number] | LocalDia["medios"][number])[];
  origen: "servidor" | "telefono";
  local: LocalDia | null;
};

export type Aviso = { tipo: "ok" | "error"; texto: string } | null;
