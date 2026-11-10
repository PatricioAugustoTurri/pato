import { describe, expect, it } from "vitest";
import { isDigital, printSizeAt300 } from "@/lib/digital";
import { jpegSize } from "@/lib/originals";
import { sizeDimensions } from "@/lib/sizes";

/** Un JPG mínimo: SOI, un APP0 de relleno y un SOF0 que dice cuánto mide. */
function fakeJpeg(width: number, height: number, padding = 16): Buffer {
  const length = Buffer.alloc(2);
  length.writeUInt16BE(padding + 2);
  const app0 = Buffer.concat([Buffer.from([0xff, 0xe0]), length, Buffer.alloc(padding)]);
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, height >> 8, height & 255, width >> 8, width & 255, 3, ...Array(9).fill(0)]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
}

describe("archivo digital", () => {
  it("lee ancho y alto del SOF aunque haya segmentos antes", () => {
    expect(jpegSize(fakeJpeg(6240, 4160, 3000))).toEqual({ width: 6240, height: 4160 });
  });

  it("no confunde una tabla Huffman (C4) con el tamaño", () => {
    const dht = Buffer.from([0xff, 0xc4, 0, 4, 1, 2]);
    const jpeg = fakeJpeg(4000, 6000);
    const withDht = Buffer.concat([jpeg.subarray(0, 2), dht, jpeg.subarray(2)]);
    expect(jpegSize(withDht)).toEqual({ width: 4000, height: 6000 });
  });

  it("rechaza lo que no es JPG", () => {
    expect(jpegSize(Buffer.from("\x89PNG\r\n\x1a\n0000000000", "binary"))).toBeNull();
  });

  it("dice hasta dónde se imprime a 300 ppp, lado largo primero", () => {
    expect(printSizeAt300(6000, 4000)).toBe("51 × 34 cm");
    expect(printSizeAt300(4000, 6000)).toBe("51 × 34 cm");
  });

  it("el carrito y el mail describen el archivo donde un A4 dice cuánto mide", () => {
    expect(isDigital("Digital")).toBe(true);
    expect(isDigital("A4")).toBe(false);
    expect(sizeDimensions("Digital")).toMatch(/JPG/);
    expect(sizeDimensions("A4")).toBe("21 × 29.7 cm");
  });
});
