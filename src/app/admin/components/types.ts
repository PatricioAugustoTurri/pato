import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

export type PhotoFormValues = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  oferta: boolean;
  preferidos: boolean;
  pais: string;
  stock: string;
  imageUrl: string;
  imageAlt: string;
};

export type AdminVariant = {
  id: number;
  size: string;
  price: string;
  currency: string;
  stock: number;
};

export type AdminPhoto = {
  id: number;
  categoryId: number | null;
  name: string;
  slug: string;
  description: string | null;
  oferta: boolean;
  preferidos: boolean;
  pais: string | null;
  images: unknown;
  stock: number;
  variants: AdminVariant[];
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  /* La portada de la colección, ya normalizada por la API: la columna guarda
     `[["url"]]` y acá llega como la cadena o como null si nunca se eligió. */
  cover: string | null;
};

export type PhotoFormProps = {
  register: UseFormRegister<PhotoFormValues>;
  errors: FieldErrors<PhotoFormValues>;
};

export type PhotoDetailsSectionProps = PhotoFormProps & {
  categories: AdminCategory[];
  countries: string[];
  control: Control<PhotoFormValues>;
};
