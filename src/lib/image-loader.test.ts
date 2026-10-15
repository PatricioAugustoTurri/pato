import { describe, expect, it } from "vitest";
import imageLoader from "@/lib/image-loader";
import localPhotos from "@/lib/local-photos.json";

const CLOUD = "https://res.cloudinary.com/dvmsjdcqi/image/upload/v1751019378/32_vwieco.jpg";

describe("imageLoader", () => {
  it("le pide a Cloudinary el ancho y el formato justos, con la firma", () => {
    expect(imageLoader({ src: CLOUD, width: 1080, quality: 85 })).toBe(
      "https://res.cloudinary.com/dvmsjdcqi/image/upload/f_auto,q_auto,w_1080,c_limit/" +
        "l_text:Playfair%20Display_200_italic:PT,co_rgb:25231F,o_45/c_scale,fl_relative,w_0.07/e_blur:300/" +
        "fl_layer_apply,g_south_east,x_0.033,y_0.032/" +
        "l_text:Playfair%20Display_200_italic:PT,co_rgb:F4F1EB,o_70/c_scale,fl_relative,w_0.07/" +
        "fl_layer_apply,g_south_east,x_0.035,y_0.035/v1751019378/32_vwieco.jpg",
    );
  });

  it("las miniaturas no llevan firma", () => {
    expect(imageLoader({ src: CLOUD, width: 384 })).toBe(
      "https://res.cloudinary.com/dvmsjdcqi/image/upload/f_auto,q_auto,w_384,c_limit/v1751019378/32_vwieco.jpg",
    );
  });

  it("los heroes (calidad 90) piden la mejor compresión automática", () => {
    expect(imageLoader({ src: CLOUD, width: 1920, quality: 90 })).toContain("f_auto,q_auto:best,w_1920,c_limit/");
  });

  it("no le encima transformaciones a una URL que ya trae las suyas", () => {
    const transformed = "https://res.cloudinary.com/dvmsjdcqi/image/upload/w_500/v1/x.jpg";
    expect(imageLoader({ src: transformed, width: 1080 })).toBe(transformed);
  });

  it("elige el ancho pregenerado más chico que alcanza", () => {
    const hero = localPhotos["/Pato/_MG_7748.jpg"];
    expect(imageLoader({ src: "/Pato/_MG_7748.jpg", width: 750 })).toBe(
      `/Pato/optimized/_MG_7748-960.${hero.hash}.webp`,
    );
    expect(imageLoader({ src: "/Pato/_MG_7748.jpg", width: 640 })).toBe(
      `/Pato/optimized/_MG_7748-640.${hero.hash}.webp`,
    );
  });

  it("por encima del ancho mayor, sirve el mayor", () => {
    const hero = localPhotos["/Pato/_MG_7748.jpg"];
    const widest = hero.widths[hero.widths.length - 1];
    expect(imageLoader({ src: "/Pato/_MG_7748.jpg", width: 3840 })).toBe(
      `/Pato/optimized/_MG_7748-${widest}.${hero.hash}.webp`,
    );
  });

  it("una dirección desconocida vuelve intacta", () => {
    expect(imageLoader({ src: "https://example.com/a.jpg", width: 640 })).toBe("https://example.com/a.jpg");
    expect(imageLoader({ src: "/otra.png", width: 640 })).toBe("/otra.png");
  });
});
