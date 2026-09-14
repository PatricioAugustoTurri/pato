import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { normalizePhotoImage } from "@/lib/photo-image";
import { getImageRatio } from "@/lib/image-shape";
import CategoryHero from "@/app/shop/[slug]/components/CategoryHero";
import CategoryRoom from "@/app/shop/[slug]/components/CategoryRoom";
import type { HungPhoto } from "@/app/shop/[slug]/components/CategoryRoom";
import type { PhotoDetailRow } from "@/types/PhotoType";
import JsonLd from "@/components/JsonLd";
import { countryLabel } from "@/lib/countries";
import { cleanTitle } from "@/lib/place";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionSchema } from "@/lib/structured-data";

type CategoryDetailRow = {
  id: number;
  name: string;
  slug: string;
  descripcion?: string | null;
  images?: unknown;
};

/* Memoizadas: `generateMetadata` y la página piden lo mismo, y sin esto son
   cuatro viajes a la base por visita en vez de dos. */
const getCategory = cache(async (slug: string): Promise<CategoryDetailRow | null> => {
  try {
    const { rows } = await pool.query<CategoryDetailRow>(`
      SELECT id, name, slug, descripcion, images
      FROM categories
      WHERE slug = $1
      LIMIT 1
    `, [slug]);

    return rows[0] ?? null;
  } catch {
    return null;
  }
});

const getPhotosForCategory = cache(async (categoryId: number): Promise<PhotoDetailRow[]> => {
  try {
    const { rows } = await pool.query<PhotoDetailRow>(
      `SELECT id, name, slug, description, images, pais
       FROM photos
       WHERE category_id = $1
       ORDER BY id ASC`,
      [categoryId],
    );
    return rows;
  } catch {
    return [];
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Shop" };
  }

  /* La descripción de colección es texto de autor largo. Se recorta para el
     buscador, pero en la página se sigue leyendo entera. */
  const description = category.descripcion
    ? metaDescription(category.descripcion)
    : metaDescription(
        `The ${category.name} collection: travel photographs by Pato Turri, printed to order in A4, A3 and A2.`,
      );

  return pageMetadata({
    title: `${category.name} Photography Prints`,
    description,
    path: `/shop/${category.slug}`,
    images: [normalizePhotoImage(category.images)].filter(Boolean),
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const photos = await getPhotosForCategory(category.id);

  /* La proporcion real de cada obra, no una caja fija: el catalogo es casi
     mitad horizontal y mitad vertical, asi que cualquier recorte uniforme le
     come medio cuadro a la mitad de la coleccion. Cloudinary la sabe y la
     respuesta se cachea un dia. */
  const ratios = await Promise.all(
    photos.map((photo) => getImageRatio(normalizePhotoImage(photo.images))),
  );
  const hung: HungPhoto[] = photos.map((photo, index) => ({ ...photo, ratio: ratios[index] }));

  const imageUrl = normalizePhotoImage(category.images);
  /* Países representados en esta colección, sin repetir y en orden.

     En inglés, como el resto de la página: la columna `pais` guarda el
     castellano y esta ficha decía «Tailandia · Marruecos» debajo de un título
     en inglés. Ahora que cada país tiene su propia sala, que ahí se llama
     «Thailand», la traducción dejó de ser una prolijidad y pasó a ser lo que
     evita que parezcan dos lugares distintos. Plegar por el nombre mostrado
     junta además «México» y «Mexico», que son el mismo país escrito de dos
     maneras en la base. */
  const paises = Array.from(
    new Set(
      photos
        .map((photo) => photo.pais)
        .filter((pais): pais is string => Boolean(pais))
        .map(countryLabel),
    ),
  ).sort((a, b) => a.localeCompare(b, "en"));

  return (
    <main className="category-page">
      {/* La colección como índice: qué obras cuelgan de acá y en qué orden.
          Es la diferencia entre que Google la lea como una página con texto y
          que la lea como el catálogo que es. */}
      <JsonLd
        data={collectionSchema({
          name: category.name,
          description: category.descripcion || "",
          path: `/shop/${category.slug}`,
          items: photos.map((photo) => ({
            name: cleanTitle(photo.name),
            path: `/shop/${category.slug}/${photo.slug}`,
          })),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/shop/${category.slug}` },
        ])}
      />
      <CategoryHero imageUrl={imageUrl} title={category.name} obras={photos.length} indexValues={paises} />
      <CategoryRoom
        roomName={category.name}
        categorySlug={category.slug}
        description={category.descripcion || ""}
        photos={hung}
      />
    </main>
  );
}
