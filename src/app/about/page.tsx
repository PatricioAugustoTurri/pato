import { pool } from "@/lib/db";
import { normalizePhotoImage } from "@/lib/photo-image";
import { getImageRatio } from "@/lib/image-shape";
import StoryReader, { type AnchoredPhoto } from "@/app/about/components/StoryReader";
import { ANCHORED_SLUGS } from "@/app/about/story";

type Row = {
  slug: string;
  name: string;
  pais: string;
  cat: string;
  images: unknown;
};

/* Trae solo las obras que la historia ancla. Si la consulta falla, la página
   sigue leyéndose: el texto es lo que importa y las imágenes lo acompañan. */
async function getAnchoredPhotos(): Promise<Record<string, AnchoredPhoto>> {
  try {
    const { rows } = await pool.query<Row>(
      `SELECT p.slug, p.name, p.pais, c.slug AS cat, p.images
       FROM photos p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ANY($1)`,
      [ANCHORED_SLUGS],
    );

    const usable = rows
      .map((row) => ({ row, url: normalizePhotoImage(row.images) }))
      .filter((entry) => entry.url);

    /* La proporcion decide el ancho de cada obra en la fila, asi que se
       resuelve antes de renderizar y en paralelo. */
    const ratios = await Promise.all(usable.map((entry) => getImageRatio(entry.url)));

    const map: Record<string, AnchoredPhoto> = {};
    usable.forEach(({ row, url }, index) => {
      map[row.slug] = {
        slug: row.slug,
        categorySlug: row.cat,
        name: row.name.replace(/^["']+/, "").replace(/["']+$/, ""),
        pais: row.pais,
        /* El `alt` guardado en la base es un rótulo interno ("guarani",
           "cocunut"); el título editorial sí describe la imagen. */
        alt: row.name,
        url,
        ratio: ratios[index],
      };
    });

    return map;
  } catch {
    return {};
  }
}

export default async function AboutPage() {
  const photos = await getAnchoredPhotos();

  return <StoryReader photos={photos} />;
}
