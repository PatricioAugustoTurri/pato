import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import CategoryHero from "@/app/shop/[slug]/components/CategoryHero";
import CategoryRoom, { type HungPhoto } from "@/app/shop/[slug]/components/CategoryRoom";
import JsonLd from "@/components/JsonLd";
import { countryIntro, countryLabel } from "@/lib/countries";
import { getImageRatio } from "@/lib/image-shape";
import { normalizePhotoImage } from "@/lib/photo-image";
import { getCountryArchive, getCountryIndex } from "@/lib/photos";
import { cleanTitle } from "@/lib/place";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionSchema } from "@/lib/structured-data";

/* Memoizada por la misma razón que la de colección: `generateMetadata` y la
   página piden exactamente lo mismo, y sin esto son dos lecturas del catálogo
   por visita en vez de una. */
const getArchive = cache(getCountryArchive);

/* El catálogo se edita desde el panel, no en un deploy, así que estas páginas
   —una por país con obra— se rehacen solas cada hora en vez de consultar la
   base en cada visita: el archivo entero más una proporción por obra. Es la
   misma cifra que usa el mapa del sitio, y en un servidor que se paga por mes
   es la diferencia entre una consulta por hora y una por lector.

   Sin la cantidad escrita a propósito: eran doce cuando esto se redactó y hoy
   son diecisiete. La cifra vive en `getCountryIndex`, que es quien la cuenta. */
export const revalidate = 3600;

/* Los países con obra se prerrenderizan al compilar. `dynamicParams` sigue en su
   valor por defecto a propósito: un país nuevo cargado desde el panel se sirve
   igual, a pedido, en vez de dar 404 hasta la próxima subida. */
export async function generateStaticParams() {
  const countries = await getCountryIndex();
  return countries.map(({ slug }) => ({ country: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const result = await getArchive(country);

  if (result.status !== "ok") {
    return { title: "Destinations" };
  }

  const { archive } = result;
  const label = countryLabel(archive.country);
  const intro = countryIntro(archive.country);

  /* Con relato, el relato; sin él, una frase contada contra la base. Lo que no
     se hace nunca es escribirle al país un texto que el autor no dijo. */
  const description = intro
    ? metaDescription(intro)
    : metaDescription(
        `${archive.photos.length} travel photographs from ${label} by Pato Turri, printed to order in A4, A3 and A2.`,
      );

  return pageMetadata({
    title: `${label} Photography Prints`,
    description,
    path: `/destinations/${country}`,
    images: [normalizePhotoImage(archive.cover?.images)].filter(Boolean),
  });
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const result = await getArchive(country);

  /* Un país sin obra no es una página vacía, es una dirección que no existe:
     el índice solo enlaza países que tienen archivo. */
  if (result.status === "missing") {
    notFound();
  }

  /* La base no contestó. Se lanza, no se dibuja: un 404 acá sería anunciar que
     esta dirección no existe —sobre una de las doce que el mapa del sitio
     publica— por un traspié que dura un minuto, y una pantalla de error
     dibujada acá sería peor todavía. `revalidate` alcanza a la ruta entera y
     no distingue una página buena de una mala: un render que termina bien se
     guarda, así que un minuto de Postgres caído dejaría "no pudimos leer esto"
     pegado a ese país durante una hora, servido con un 200 que un buscador
     puede indexar. Lanzando, el render no se guarda, el estado es el que de
     verdad pasó, y la pantalla la pone `error.tsx`, que es la misma sala de
     tinta con un botón de reintentar y vive fuera de cualquier caché. */
  if (result.status === "unreadable") {
    throw new Error(`No se pudo leer el archivo del país "${country}".`);
  }

  const { archive } = result;
  const label = countryLabel(archive.country);
  const intro = countryIntro(archive.country);

  /* La proporción real de cada obra, igual que en una sala de colección: el
     catálogo es casi mitad horizontal y mitad vertical, y cualquier caja fija
     le come medio cuadro a la mitad del archivo. */
  const ratios = await Promise.all(
    archive.photos.map((photo) => getImageRatio(normalizePhotoImage(photo.images))),
  );
  const hung: HungPhoto[] = archive.photos.map((photo, index) => ({
    ...photo,
    ratio: ratios[index],
  }));

  return (
    <main className="category-page">
      {/* El país como índice del archivo, no como página con texto: lo que
          Google tiene que leer acá es qué obras cuelgan y en qué orden. */}
      <JsonLd
        data={collectionSchema({
          name: `${label} — travel photography prints`,
          description: intro ?? `Travel photographs from ${label} by Pato Turri.`,
          path: `/destinations/${country}`,
          items: archive.photos.map((photo) => ({
            name: cleanTitle(photo.name),
            path: `/shop/${photo.categorySlug}/${photo.slug}`,
          })),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Destinations", path: "/destinations" },
          { name: label, path: `/destinations/${country}` },
        ])}
      />

      {/* La tapa es una obra del propio país. La ficha invierte la de una sala
          de colección: aquella cuenta los países que recorre, esta las
          colecciones que atraviesa. Mismo mueble, otro eje. */}
      <CategoryHero
        imageUrl={normalizePhotoImage(archive.cover?.images)}
        title={label}
        obras={archive.photos.length}
        indexLabel="Collections"
        indexValues={archive.collections}
      />

      <CategoryRoom
        roomName={label}
        /* El muro de un país no usa este valor: cada obra trae la suya, porque
           vienen de colecciones distintas. Se le pasa la de la tapa, que es
           real, en vez de un hueco que no significa nada. */
        categorySlug={archive.cover?.categorySlug ?? ""}
        description={intro ?? ""}
        photos={hung}
        plateMeta="collection"
      />
    </main>
  );
}
