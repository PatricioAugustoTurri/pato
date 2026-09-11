import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { normalizePhotoAlt, normalizePhotoImage } from "@/lib/photo-image";
import { getImageRatio } from "@/lib/image-shape";
import { cleanTitle, titleNamesPlace } from "@/lib/place";
import PhotoPlate from "@/app/shop/[slug]/[photoSlug]/components/PhotoPlate";
import PurchasePanel from "@/app/shop/[slug]/[photoSlug]/components/PurchasePanel";
import WorkNote from "@/app/shop/[slug]/[photoSlug]/components/WorkNote";
import type { PhotoDetailRow, PhotoVariant } from "@/types/PhotoType";

type Neighbour = { id: number; name: string; slug: string; images: unknown };

async function getPhotoDetail(slug: string, photoSlug: string): Promise<PhotoDetailRow | null> {
  const { rows } = await pool.query<Omit<PhotoDetailRow, "variants">>(
    `SELECT p.id,
            p.name,
            p.slug,
            p.description,
            p.images,
            p.pais,
            c.name AS "categoryName",
            c.slug AS "categorySlug"
     FROM photos p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE c.slug = $1 AND p.slug = $2
     LIMIT 1`,
    [slug, photoSlug],
  );

  const photo = rows[0];
  if (!photo) return null;

  const { rows: variants } = await pool.query<PhotoVariant>(
    `SELECT id, size, price, stock
     FROM photo_variants
     WHERE photo_id = $1
     ORDER BY price ASC`,
    [photo.id],
  );

  return { ...photo, variants };
}

/* Sin esto la obra es un callejon sin salida: se mira, se agrega al carrito y
   la unica salida es el boton de atras del navegador. Tres vecinas de la misma
   coleccion devuelven al visitante al recorrido. */
async function getNeighbours(categorySlug: string, photoId: number): Promise<Neighbour[]> {
  try {
    const { rows } = await pool.query<Neighbour>(
      `SELECT p.id, p.name, p.slug, p.images
       FROM photos p
       JOIN categories c ON c.id = p.category_id
       WHERE c.slug = $1 AND p.id <> $2
       ORDER BY abs(p.id - $2) ASC
       LIMIT 3`,
      [categorySlug, photoId],
    );
    return rows;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; photoSlug: string }>;
}): Promise<Metadata> {
  const { slug, photoSlug } = await params;

  let photo: PhotoDetailRow | null;
  try {
    photo = await getPhotoDetail(slug, photoSlug);
  } catch {
    photo = null;
  }

  if (!photo) {
    return { title: "Pato Turri | Shop" };
  }

  const title = cleanTitle(photo.name);
  const description = photo.description || "A photograph from the archive, printed to order.";

  return {
    title: `Pato Turri | ${title}`,
    description,
    openGraph: { title: `Pato Turri | ${title}`, description, type: "website" },
  };
}

export default async function PhotoDetailPage({
  params,
}: {
  params: Promise<{ slug: string; photoSlug: string }>;
}) {
  const { slug, photoSlug } = await params;

  let photo: PhotoDetailRow | null;
  try {
    photo = await getPhotoDetail(slug, photoSlug);
  } catch {
    photo = null;
  }

  if (!photo) {
    notFound();
  }

  const imageUrl = normalizePhotoImage(photo.images);
  const title = cleanTitle(photo.name);
  const imageAlt = normalizePhotoAlt(photo.images, title);
  const place = titleNamesPlace(title, photo.pais) ? "" : photo.pais;

  const [ratio, neighbours] = await Promise.all([
    getImageRatio(imageUrl),
    getNeighbours(photo.categorySlug, photo.id),
  ]);

  return (
    <main className="work-page">
      {/* Mirar y comprar, en la misma pantalla. Antes el selector de tamano y
          el boton vivian debajo de 1.400 caracteres de descripcion: en la
          pagina cuyo unico trabajo es vender una copia, comprar quedaba fuera
          del primer viewport. */}
      <section className="work-view is-dark-room">
        <PhotoPlate
          imageUrl={imageUrl}
          alt={imageAlt}
          ratio={ratio}
          viewTransitionName={`photo-${photo.id}`}
        />

        <div className="work-counter">
          <nav className="work-trail" aria-label="Breadcrumb">
            <Link href="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/shop/${photo.categorySlug}`}>{photo.categoryName}</Link>
          </nav>

          <h1 className="work-title">{title}</h1>
          {place && <p className="work-place">{place}</p>}

          <PurchasePanel
            photoId={photo.id}
            photoName={title}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            href={`/shop/${photo.categorySlug}/${photo.slug}`}
            variants={photo.variants}
          />
        </div>
      </section>

      {photo.description && <WorkNote text={photo.description} />}

      {neighbours.length > 0 && (
        <section className="work-more" aria-labelledby="work-more-heading">
          <h2 id="work-more-heading">
            More from {photo.categoryName}
            <Link href={`/shop/${photo.categorySlug}`}>See the collection ↗</Link>
          </h2>

          <ul>
            {neighbours.map((neighbour) => {
              const url = normalizePhotoImage(neighbour.images);
              const neighbourTitle = cleanTitle(neighbour.name);
              return (
                <li key={neighbour.id}>
                  <Link href={`/shop/${photo.categorySlug}/${neighbour.slug}`}>
                    <span className="work-more-frame">
                      {url && (
                        <Image
                          src={url}
                          alt={normalizePhotoAlt(neighbour.images, neighbourTitle)}
                          fill
                          sizes="(max-width: 700px) 80vw, 30vw"
                          quality={85}
                        />
                      )}
                    </span>
                    <span className="work-more-name">{neighbourTitle}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
