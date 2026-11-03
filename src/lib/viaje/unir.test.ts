import { describe, expect, it } from "vitest";
import type { AdminDia, AdminMedio, DiaPayload } from "@/lib/viaje/types";
import { unirDia, unirTexto } from "./unir";

const medio = (clientId: string, extra: Partial<AdminMedio> = {}): AdminMedio => ({
  clientId,
  tipo: "foto",
  url: `https://res.cloudinary.com/x/${clientId}.jpg`,
  publicId: clientId,
  ancho: null,
  alto: null,
  duracion: null,
  altEs: null,
  altEn: null,
  hora: null,
  lat: null,
  lon: null,
  camara: null,
  portada: false,
  ...extra,
});

const dia = (extra: Partial<AdminDia> = {}): AdminDia => ({
  id: 1,
  clientId: "a",
  paisId: 1,
  numero: 12,
  fecha: "2026-11-03",
  hora: null,
  desde: null,
  hasta: null,
  km: null,
  desnivel: null,
  lat: null,
  lon: null,
  latInicio: null,
  lonInicio: null,
  clima: null,
  tituloEs: "",
  textoEs: "",
  tituloEn: null,
  textoEn: null,
  enEstado: "sin",
  enViejo: false,
  publicado: false,
  medios: [],
  actualizado: "2026-11-03T10:00:00.000Z",
  ...extra,
});

const payload = (extra: Partial<DiaPayload> = {}): DiaPayload => {
  const { id: _id, numero: _n, enViejo: _v, actualizado: _a, clima: _c, ...resto } = dia({ clientId: "b", ...extra });
  return { ...resto, ...extra };
};

describe("unirTexto", () => {
  it("si uno está vacío, queda el otro", () => {
    expect(unirTexto("", "Llovió.")).toBe("Llovió.");
    expect(unirTexto("Llovió.", "  ")).toBe("Llovió.");
  });

  it("no repite lo que ya estaba", () => {
    expect(unirTexto("Llovió.\n\nDormí en un templo.", "Llovió.")).toBe("Llovió.\n\nDormí en un templo.");
  });

  it("si lo que llega sigue lo que había, queda lo que llega", () => {
    expect(unirTexto("Llovió.", "Llovió.\n\nDormí en un templo.")).toBe("Llovió.\n\nDormí en un templo.");
  });

  it("si se escribió distinto en los dos lados, quedan los dos", () => {
    expect(unirTexto("Llovió.\n\nEn la compu.", "Llovió.\n\nEn el teléfono.")).toBe("Llovió.\n\nEn la compu.\n\nEn el teléfono.");
  });
});

describe("unirDia por fecha", () => {
  it("el texto de la compu y las fotos del teléfono quedan en un día", () => {
    const compu = dia({ tituloEs: "Mariposas", textoEs: "Subí al paso.", km: 84, medios: [medio("m1")] });
    const telefono = payload({ km: 86.2, lat: 35, lon: 138, medios: [medio("m2"), medio("m3")] });
    const unido = unirDia(compu, telefono, "fecha");
    expect(unido.clientId).toBe("a");
    expect(unido.tituloEs).toBe("Mariposas");
    expect(unido.textoEs).toBe("Subí al paso.");
    expect(unido.km).toBe(86.2);
    expect([unido.lat, unido.lon]).toEqual([35, 138]);
    expect(unido.medios.map((m) => m.clientId)).toEqual(["m1", "m2", "m3"]);
  });

  it("mantiene el país y lo publicado de lo que ya estaba", () => {
    const unido = unirDia(dia({ paisId: 3, publicado: true }), payload({ paisId: 4, publicado: false }), "fecha");
    expect(unido.paisId).toBe(3);
    expect(unido.publicado).toBe(true);
  });

  it("mandarlo dos veces da lo mismo", () => {
    const telefono = payload({ textoEs: "Desde el teléfono.", medios: [medio("m2")] });
    const una = unirDia(dia({ textoEs: "Desde la compu.", medios: [medio("m1")] }), telefono, "fecha");
    const dos = unirDia(dia({ ...una, clientId: "a" } as Partial<AdminDia>), telefono, "fecha");
    expect(dos.textoEs).toBe(una.textoEs);
    expect(dos.medios.map((m) => m.clientId)).toEqual(una.medios.map((m) => m.clientId));
  });

  it("deja una sola portada, la que llega", () => {
    const unido = unirDia(
      dia({ medios: [medio("m1", { portada: true })] }),
      payload({ medios: [medio("m2", { portada: true })] }),
      "fecha",
    );
    expect(unido.medios.filter((m) => m.portada).map((m) => m.clientId)).toEqual(["m2"]);
  });
});

describe("unirDia por edición", () => {
  it("no borra las fotos que se sumaron en otro lado", () => {
    const servidor = dia({ medios: [medio("m1"), medio("m2")] });
    const cambio = payload({ clientId: "a", tituloEs: "Nuevo título", medios: [medio("m1", { altEs: "El paso" })] });
    const unido = unirDia(servidor, cambio, "edicion");
    expect(unido.tituloEs).toBe("Nuevo título");
    expect(unido.medios.map((m) => [m.clientId, m.altEs])).toEqual([
      ["m1", "El paso"],
      ["m2", null],
    ]);
  });

  it("respeta despublicar y cambiar de país", () => {
    const unido = unirDia(dia({ paisId: 3, publicado: true }), payload({ clientId: "a", paisId: 4, publicado: false }), "edicion");
    expect(unido.paisId).toBe(4);
    expect(unido.publicado).toBe(false);
  });
});
