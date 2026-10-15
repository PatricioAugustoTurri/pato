import { describe, expect, it } from "vitest";
import { MAX_PER_LINE } from "@/lib/cart-limits";
import { parseCheckoutItems } from "@/lib/checkout-cart";

describe("parseCheckoutItems", () => {
  it("rechaza un carrito vacío o que no es una lista", () => {
    expect(parseCheckoutItems([])).toEqual({ ok: false, error: "Your cart is empty." });
    expect(parseCheckoutItems(undefined).ok).toBe(false);
    expect(parseCheckoutItems({ photoId: 1 }).ok).toBe(false);
  });

  it("acepta un carrito correcto y recorta el tamaño", () => {
    expect(parseCheckoutItems([{ photoId: 3, size: " A4 ", quantity: 2 }])).toEqual({
      ok: true,
      lines: [{ photoId: 3, size: "A4", quantity: 2 }],
    });
  });

  it("suma las líneas repetidas de la misma obra y el mismo tamaño", () => {
    const result = parseCheckoutItems([
      { photoId: 3, size: "A4", quantity: 2 },
      { photoId: 3, size: "A3", quantity: 1 },
      { photoId: 3, size: "A4", quantity: 4 },
    ]);

    expect(result).toEqual({
      ok: true,
      lines: [
        { photoId: 3, size: "A4", quantity: 6 },
        { photoId: 3, size: "A3", quantity: 1 },
      ],
    });
  });

  it.each([
    ["cantidad negativa", { photoId: 1, size: "A4", quantity: -3 }],
    ["cantidad cero", { photoId: 1, size: "A4", quantity: 0 }],
    ["cantidad decimal", { photoId: 1, size: "A4", quantity: 1.5 }],
    ["cantidad absurda", { photoId: 1, size: "A4", quantity: 1e21 }],
    ["cantidad como texto", { photoId: 1, size: "A4", quantity: "dos" }],
    ["obra inexistente", { photoId: 0, size: "A4", quantity: 1 }],
    ["obra decimal", { photoId: 1.2, size: "A4", quantity: 1 }],
    ["tamaño vacío", { photoId: 1, size: "  ", quantity: 1 }],
    ["tamaño que no es texto", { photoId: 1, size: 4, quantity: 1 }],
    ["línea nula", null],
  ])("rechaza %s", (_, item) => {
    expect(parseCheckoutItems([item]).ok).toBe(false);
  });

  it("deja pasar exactamente el tope de copias", () => {
    expect(parseCheckoutItems([{ photoId: 1, size: "A4", quantity: MAX_PER_LINE }]).ok).toBe(true);
  });

  it("aplica el tope DESPUÉS de sumar, no línea por línea", () => {
    const half = Math.ceil((MAX_PER_LINE + 1) / 2);
    const result = parseCheckoutItems([
      { photoId: 1, size: "A4", quantity: half },
      { photoId: 1, size: "A4", quantity: half },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(MAX_PER_LINE));
  });

  it("el tope es por tamaño: la misma obra en dos tamaños no se suma", () => {
    expect(
      parseCheckoutItems([
        { photoId: 1, size: "A4", quantity: MAX_PER_LINE },
        { photoId: 1, size: "A3", quantity: MAX_PER_LINE },
      ]).ok,
    ).toBe(true);
  });
});
