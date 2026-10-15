import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

export type PhotoFormValues = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  oferta: boolean;
  preferidos: boolean;
  pais: string;
  imageUrl: string;
  imageAlt: string;
};

export type AdminVariant = {
  id: number;
  size: string;
  price: string;
  currency: string;
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
  variants: AdminVariant[];
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  /* La portada de la colección, ya normalizada por la API: la columna guarda
     `[["url"]]` y acá llega como la cadena o como null si nunca se eligió. */
  cover: string | null;
  /* El texto editorial de `/shop/<colección>`. Lo escribe el autor y puede no
     estar: una colección recién creada nace sin relato. */
  descripcion: string | null;
};

export type AdminSize = {
  id: number;
  size: string;
  price: number;
  position: number;
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
