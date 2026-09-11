import type { Metadata } from "next";
import { cache } from "react";
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
import JsonLd from "@/components/JsonLd";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";

type Neighbour = { id: number; name: string; slug: string; images: unknown };

/* `cache` porque esta consulta se pide dos veces por visita —una para los
   metadatos y otra para dibujar la obra— y son dos viajes a la base para
   traer exactamente la misma fila. React la resuelve una sola vez por pedido. */
const getPhotoDetail = cache(async (slug: string, photoSlug: string): Promise<PhotoDetailRow | null> => {
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
});

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
    return { title: "Shop" };
  }

  const title = cleanTitle(photo.name);
  /* El título de la obra va solo, sin la marca pegada adelante: la plantilla
     del layout raíz ya agrega " · Pato Turri". Lo que buscaba alguien es el
     nombre de la fotografía, y es lo primero que tiene que leerse. */
  const place = titleNamesPlace(title, photo.pais) ? "" : photo.pais;

  const lowest = photo.variants.length
    ? Math.min(...photo.variants.map((variant) => Number(variant.price)))
    : null;

  /* Si el autor escribió su nota, esa es la descripción. Si no, se arma una
     con lo que la base sí sabe: colección, lugar y precio de entrada. Nada de
     papel ni de laboratorio, que no está confirmado. */
  const description = photo.description
    ? metaDescription(photo.description)
    : metaDescription(
        `${title}, a photograph from the ${photo.categoryName} collection by Pato Turri` +
          `${place ? `, made in ${place}` : ""}. Fine art print` +
          `${lowest ? `, from €${lowest}` : ""}, shipped across the EU.`,
      );

  return pageMetadata({
    /* El título de la obra va solo, sin el país colgado atrás. Los títulos del
       autor ya miden 46 caracteres de mediana y llegan a 66; con " · Pato
       Turri" detrás, sumarle "— Argentina" los deja cortados en Google en
       todos los casos. El país sigue estando donde se lee: en la página, en la
       cartela bajo el título, y en la descripción cuando no hay nota del
       autor. */
    title,
    description,
    path: `/shop/${photo.categorySlug}/${photo.slug}`,
    /* La obra es su propia vista previa. Compartir el enlace de una fotografía
       y que aparezca una tarjeta genérica es perder lo único que vende. */
    images: [normalizePhotoImage(photo.images)].filter(Boolean),
  });
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

  const prices = photo.variants.map((variant) => Number(variant.price));
  const path = `/shop/${photo.categorySlug}/${photo.slug}`;

  return (
    <main className="work-page">
      {/* Lo que ya dice la pantalla, en el formato que lee Google: el título,
          la nota del autor, la imagen, el rango de precios de los tres tamaños
          y si queda stock. Nada inventado — los precios salen de las mismas
          `photo_variants` con las que el servidor cobra. */}
      {prices.length > 0 && (
        <JsonLd
          data={productSchema({
            name: title,
            description: photo.description || imageAlt,
            image: imageUrl,
            path,
            prices,
            inStock: photo.variants.some((variant) => variant.stock > 0),
          })}
        />
      )}
      {/* Las mismas migas que se dibujan abajo, dichas una vez más para que el
          resultado de búsqueda pueda mostrar la ruta en vez de la URL cruda. */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Shop", path: "/shop" },
          { name: photo.categoryName, path: `/shop/${photo.categorySlug}` },
          { name: title, path },
        ])}
      />
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
