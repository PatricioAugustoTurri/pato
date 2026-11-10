import { NextResponse } from "next/server";
import { consumeDownload, downloadPath, refundDownload } from "@/lib/downloads";
import { openOriginal } from "@/lib/originals";

/*
 * Manda el JPG original. Es POST y no GET a propósito: el mail lleva el link a
 * la página de descarga, no al archivo, porque Outlook, Gmail y los antivirus
 * abren los links de un mail para revisarlos. Con un GET, cada revisión gastaba
 * una de las descargas —y bajaba 30 MB—. Un robot no aprieta un botón de un
 * formulario; una persona sí.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const back = new URL(downloadPath(token), request.url);

  const grant = await consumeDownload(token);
  if (!grant) {
    return NextResponse.redirect(back, 303);
  }

  const original = await openOriginal(grant.file);
  if (!original) {
    await refundDownload(token);
    console.error(`[descarga] falta en el disco el original ${grant.file}`);
    back.searchParams.set("error", "1");
    return NextResponse.redirect(back, 303);
  }

  return new Response(original.stream, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(original.bytes),
      "Content-Disposition": `attachment; filename="${grant.slug}-pato-turri.jpg"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
