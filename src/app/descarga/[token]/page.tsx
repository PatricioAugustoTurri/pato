import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDownload } from "@/lib/downloads";
import {
  DIGITAL_LICENSE,
  DONATE_URL,
  megabytes,
  megapixels,
  printSizeAt300,
} from "@/lib/digital";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your download",
  robots: { index: false, follow: false },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/*
 * La página a la que lleva el link del mail. El archivo se baja con el botón y
 * no al abrir la página: los lectores de correo abren los links para revisarlos
 * y cada visita así gastaba una descarga (ver /api/descarga/[token]).
 */
export default async function DownloadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const download = await getDownload(token);

  if (!download) notFound();

  const left = Math.max(download.maxDownloads - download.downloads, 0);
  const usable = !download.expired && left > 0 && Boolean(download.file);
  const facts =
    download.width && download.height
      ? [
          `${download.width} × ${download.height} px`,
          `${megapixels(download.width, download.height)} MP`,
          download.bytes ? `${megabytes(download.bytes)} MB` : null,
        ].filter(Boolean)
      : [];

  return (
    <main className="download-room is-dark-room">
      {/* La obra grande, como en su ficha: es lo que se está por llevar. */}
      {download.imageUrl && (
        <div className="download-plate">
          <Image
            src={download.imageUrl}
            alt={download.alt}
            fill
            priority
            sizes="(max-width: 900px) 92vw, 55vw"
            quality={85}
            style={{ objectFit: "contain" }}
          />
        </div>
      )}

      <div className="cart-note download-note">
        <p className="download-eyebrow">Digital file</p>
        <h1>{download.title}</h1>

        {facts.length > 0 && <p className="download-facts">{facts.join(" · ")}</p>}

        {usable ? (
          <>
            <p>
              The original JPG, at full quality. It prints sharp up to about{" "}
              {download.width && download.height
                ? printSizeAt300(download.width, download.height)
                : "A3"}{" "}
              at 300 dpi, and larger if it hangs on a wall.
            </p>

            {error && (
              <p className="cart-error" role="alert">
                The file could not be sent just now. Your download was not used — please try
                again, or write to <a href="mailto:info@patoturri.com">info@patoturri.com</a>.
              </p>
            )}

            <form method="post" action={`/api/descarga/${download.token}`}>
              <button type="submit" className="buy-add download-button">
                <span>Download the photograph</span>
                <b>JPG</b>
              </button>
            </form>

            <p className="download-small">
              {left === 1 ? "1 download left" : `${left} downloads left`} · the link works until{" "}
              {formatDate(download.expiresAt)}. On a phone, a wifi connection helps: the file is
              large.
            </p>
          </>
        ) : (
          <p>
            {download.expired
              ? `This link expired on ${formatDate(download.expiresAt)}.`
              : !download.file
                ? "This file is not available right now."
                : "This link has been used all the times it allows."}{" "}
            If you still need the file, write to{" "}
            <a href="mailto:info@patoturri.com">info@patoturri.com</a> and it will be sent again.
          </p>
        )}

        <p className="download-small">{DIGITAL_LICENSE} The copyright stays with Pato Turri.</p>

        <div className="download-thanks">
          <p>
            Thank you. Buying this file is a contribution to the bike ride from Japan to
            Portugal, and it helps more than you think.
          </p>
          <div className="download-links">
            <a href={DONATE_URL} className="text-link" target="_blank" rel="noreferrer">
              Buy me something on the road <span aria-hidden="true">↗</span>
            </a>
            <Link href="/shop" className="text-link">
              Keep looking <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
