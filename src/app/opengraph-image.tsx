import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

/**
 * La tarjeta que aparece cuando alguien comparte un enlace del sitio en
 * WhatsApp, Instagram o Facebook.
 *
 * Sin esto, las nueve páginas que no son una obra se comparten como un
 * rectángulo gris con una URL: un enlace que nadie abre. Las obras y las
 * colecciones no pasan por acá —cada una manda su propia fotografía, que es
 * mejor tarjeta que cualquier cosa que se pueda dibujar.
 *
 * Es tipográfica y no una fotografía porque no hay ninguna imagen propia en el
 * repositorio: el catálogo entero vive en Cloudinary, y elegir una obra fija
 * como cara del sitio sería una decisión de marca que no me toca.
 */
export const alt = `${SITE_NAME} — travel photography prints`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Las tres caras de la marca, en TTF porque satori no lee los `woff2` que
   genera `next/font`. Se leen al compilar —la tarjeta se prerenderiza en el
   build— así que ninguna se le sirve nunca a un visitante.

   Van las tres y no una sola: satori dibuja TODO con la única fuente que
   encuentre, así que cargar únicamente Playfair ponía la itálica de "Turri"
   también en el titular y en el pie. */
const FACES = {
  heading: "FamiljenGrotesk-Medium.ttf",
  wordmark: "PlayfairDisplay-Italic.ttf",
  body: "DMSans-Regular.ttf",
} as const;

function loadFace(file: string) {
  return readFile(join(process.cwd(), "src/fonts", file));
}

export default async function OpengraphImage() {
  const [heading, wordmark, body] = await Promise.all([
    loadFace(FACES.heading),
    loadFace(FACES.wordmark),
    loadFace(FACES.body),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          /* El papel del sitio, no un blanco de plantilla: la tarjeta es lo
             primero que se ve de la marca. */
          backgroundColor: "#f4f1eb",
          color: "#25231f",
          fontFamily: "DM Sans",
          padding: "80px 90px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            color: "#6f675d",
          }}
        >
          FINE ART PRINTS
        </div>

        {/* El wordmark, en dos líneas y con las dos caras que le corresponden:
            "Pato" en la voz de los títulos y "Turri" en Playfair itálica, que
            es lo único que queda de esa familia en el sitio y no cambia. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Familjen Grotesk",
              fontSize: 132,
              lineHeight: 1,
            }}
          >
            Pato
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Playfair Display",
              fontStyle: "italic",
              fontSize: 132,
              lineHeight: 1.1,
              color: "#a85527",
            }}
          >
            Turri
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 28,
            color: "#46423c",
            borderTop: "2px solid #d9d3c9",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex" }}>Travel photography, printed to order</div>
          <div style={{ display: "flex", color: "#6f675d" }}>A4 · A3 · A2</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Familjen Grotesk", data: heading, style: "normal", weight: 500 },
        { name: "Playfair Display", data: wordmark, style: "italic", weight: 500 },
        { name: "DM Sans", data: body, style: "normal", weight: 400 },
      ],
    },
  );
}
