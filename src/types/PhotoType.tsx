export type PhotoVariant = {
  id: number;
  size: string;
  price: number;
  stock: number;
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