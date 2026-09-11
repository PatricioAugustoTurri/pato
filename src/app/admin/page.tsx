"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import AdminHeader from "./components/AdminHeader";
import AdminNav from "./components/AdminNav";
import ImagesSection from "./components/ImagesSection";
import PhotoDetailsSection from "./components/PhotoDetailsSection";
import PhotosList from "./components/PhotosList";
import PhotosGridSkeleton from "./components/PhotosGridSkeleton";
import type { AdminCategory, AdminPhoto, PhotoFormValues } from "./components/types";

const createDefaultValues = (): PhotoFormValues => ({
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  oferta: false,
  preferidos: false,
  pais: "",
  stock: "0",
  images: "[]",
});

export default function AdminPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AdminPhoto | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<PhotoFormValues>({
    defaultValues: createDefaultValues(),
  });

  // Se derivan de las fotos ya cargadas: no hace falta otra consulta.
  const countries = Array.from(
    new Set(photos.map((photo) => photo.pais).filter((pais): pais is string => Boolean(pais))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const loadPhotos = async () => {
    try {
      const response = await axios.get<AdminPhoto[]>("/api/admin/photos");
      setPhotos(response.data);
      setLoadError(null);
    } catch {
      setLoadError("No se pudieron cargar las fotografías.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      axios.get<AdminPhoto[]>("/api/admin/photos"),
      axios.get<AdminCategory[]>("/api/admin/categories"),
    ])
      .then(([photosResponse, categoriesResponse]) => {
        if (isMounted) {
          setPhotos(photosResponse.data);
          setCategories(categoriesResponse.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No se pudieron cargar las fotografías.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (photo: AdminPhoto) => {
    if (!confirm(`¿Eliminar "${photo.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/photos/${photo.id}`);
      await loadPhotos();
    } catch {
      setFeedback({ type: "error", message: "No se pudo eliminar la foto." });
    }
  };

  const startCreating = () => {
    setEditingPhoto(null);
    reset(createDefaultValues());
    setFeedback(null);
    setShowForm(true);
  };

  const startEditing = (photo: AdminPhoto) => {
    setEditingPhoto(photo);
    reset({
      categoryId: photo.categoryId?.toString() ?? "",
      name: photo.name,
      slug: photo.slug,
      description: photo.description ?? "",
      oferta: photo.oferta,
      preferidos: photo.preferidos,
      pais: photo.pais ?? "",
      stock: photo.stock.toString(),
      images: JSON.stringify(photo.images, null, 2),
    });
    setFeedback(null);
    setShowForm(true);
  };

  const onSubmit = async (values: PhotoFormValues) => {
    setFeedback(null);

    let images: unknown;
    try {
      images = JSON.parse(values.images || "[]");
    } catch {
      setFeedback({ type: "error", message: "El campo de imágenes debe contener un JSON válido." });
      return;
    }

    try {
      const payload = {
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        name: values.name,
        slug: values.slug,
        description: values.description,
        oferta: values.oferta,
        preferidos: values.preferidos,
        pais: values.pais,
        stock: Number(values.stock),
        images,
      };
      const { data } = editingPhoto
        ? await axios.put(`/api/admin/photos/${editingPhoto.id}`, payload)
        : await axios.post("/api/admin/photos", payload);
      setFeedback({ type: "success", message: `${editingPhoto ? "Foto actualizada" : "Foto guardada"} correctamente con ID ${data.id}.` });
      await loadPhotos();
      setShowForm(false);
      setEditingPhoto(null);
      reset(createDefaultValues());
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      setFeedback({ type: "error", message: message || "No se pudo guardar la foto." });
    }
  };

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader />
      {!showForm ? (
        <>
          {loadError && <p className="admin-feedback error">{loadError}</p>}
          {isLoading ? (
            <PhotosGridSkeleton />
          ) : (
            <PhotosList photos={photos} onSelect={startEditing} onCreate={startCreating} onDelete={handleDelete} />
          )}
        </>
      ) : (
        <>
          <Button type="button" variant="ghost" className="admin-close-form" onClick={() => setShowForm(false)}>
            <X aria-hidden="true" /> Volver a las fotografías
          </Button>
          <form className="admin-form" onSubmit={handleSubmit(onSubmit)}>
            <PhotoDetailsSection register={register} errors={errors} categories={categories} countries={countries} control={control} />
            <ImagesSection register={register} errors={errors} />

            {feedback && <p className={`admin-feedback ${feedback.type}`}>{feedback.message}</p>}
            <Button className="admin-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar fotografía"}
            </Button>
          </form>
        </>
      )}
    </main>
  );
}
