/* Sin `stock`: la consulta dejo de traerlo y el tipo tiene que decir lo que la
   fila realmente trae. Declararlo igual haria que `variant.stock` compilara y
   llegara `undefined` en tiempo de ejecucion, que es la falla que no avisa. */
export type PhotoVariant = {
  id: number;
  size: string;
  price: number;
};

export type PhotoDetailRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  images?: unknown;
  pais?: string | null;
  categoryName: string;
  categorySlug: string;
  variants: PhotoVariant[];
};