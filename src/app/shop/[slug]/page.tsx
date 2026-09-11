import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { normalizePhotoImage } from "@/lib/photo-image";
import { getImageRatio } from "@/lib/image-shape";
import CategoryHero from "@/app/shop/[slug]/components/CategoryHero";
import CategoryRoom from "@/app/shop/[slug]/components/CategoryRoom";
import type { Edition, HungPhoto } from "@/app/shop/[slug]/components/CategoryRoom";
import type { PhotoDetailRow } from "@/types/PhotoType";

type CategoryDetailRow = {
  id: number;
  name: string;
  slug: string;
  descripcion?: string | null;
  images?: unknown;
};

async function getCategory(slug: string): Promise<CategoryDetailRow | null> {
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
}

async function getPhotosForCategory(categoryId: number): Promise<PhotoDetailRow[]> {
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
}

/* Los tamanos y su precio salen de `photo_variants`, que es donde el checkout
   los re-tarifa: si algun dia dejan de ser uniformes, la sala lo dice sola en
   vez de mentir con una constante escrita en la vista. Se muestran solo si esta
   coleccion cobra un unico precio por tamano; con precios mezclados el bloque
   se calla, porque una cifra por coleccion ya no seria verdad. */
const SIZE_NOTE: Record<string, string> = {
  A4: "21 × 29.7 cm",
  A3: "29.7 × 42 cm",
  A2: "42 × 59.4 cm",
};

async function getEditions(categoryId: number): Promise<Edition[]> {
  try {
    const { rows } = await pool.query<{ size: string; price: string; spread: number }>(
      `SELECT v.size,
              min(v.price)::text                  AS price,
              count(DISTINCT v.price)::int        AS spread
       FROM photo_variants v
       JOIN photos p ON p.id = v.photo_id
       WHERE p.category_id = $1
       GROUP BY v.size
       ORDER BY min(v.price) ASC`,
      [categoryId],
    );

    if (rows.length === 0 || rows.some((row) => row.spread > 1)) return [];

    return rows.map((row) => ({
      size: SIZE_NOTE[row.size] ? `${row.size} · ${SIZE_NOTE[row.size]}` : row.size,
      price: `€${Math.round(Number(row.price))}`,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Pato Turri | Shop" };
  }

  const description = category.descripcion || "Travel photography prints, made to be lived slowly.";

  return {
    title: `Pato Turri | ${category.name}`,
    description,
    openGraph: { title: `Pato Turri | ${category.name}`, description, type: "website" },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [photos, editions] = await Promise.all([
    getPhotosForCategory(category.id),
    getEditions(category.id),
  ]);

  /* La proporcion real de cada obra, no una caja fija: el catalogo es casi
     mitad horizontal y mitad vertical, asi que cualquier recorte uniforme le
     come medio cuadro a la mitad de la coleccion. Cloudinary la sabe y la
     respuesta se cachea un dia. */
  const ratios = await Promise.all(
    photos.map((photo) => getImageRatio(normalizePhotoImage(photo.images))),
  );
  const hung: HungPhoto[] = photos.map((photo, index) => ({ ...photo, ratio: ratios[index] }));

  const imageUrl = normalizePhotoImage(category.images);
  // Países representados en esta colección, sin repetir y en orden.
  const paises = Array.from(
    new Set(photos.map((photo) => photo.pais).filter((pais): pais is string => Boolean(pais))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <main className="category-page">
      <CategoryHero imageUrl={imageUrl} title={category.name} obras={photos.length} paises={paises} />
      <CategoryRoom
        categoryName={category.name}
        categorySlug={category.slug}
        description={category.descripcion || ""}
        photos={hung}
        editions={editions}
      />
    </main>
  );
}
