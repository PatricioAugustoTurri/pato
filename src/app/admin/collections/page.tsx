"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { LayoutGrid } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import AdminNav from "../components/AdminNav";
import CollectionsList from "./components/CollectionsList";
import CollectionsSkeleton from "./components/CollectionsSkeleton";
import type { AdminCategory, AdminPhoto } from "../components/types";

export default function AdminCollectionsPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      axios.get<AdminCategory[]>("/api/admin/categories"),
      axios.get<AdminPhoto[]>("/api/admin/photos"),
    ])
      .then(([categoriesResponse, photosResponse]) => {
        if (isMounted) {
          setCategories(categoriesResponse.data);
          setPhotos(photosResponse.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No se pudieron cargar las colecciones.");
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

  const handleSelect = async (category: AdminCategory, photo: AdminPhoto) => {
    setSavingId(category.id);
    setFeedback(null);

    try {
      const { data } = await axios.put<{ cover: string }>(`/api/admin/categories/${category.id}`, {
        photoId: photo.id,
      });
      setCategories((current) =>
        current.map((item) => (item.id === category.id ? { ...item, cover: data.cover } : item)),
      );
      setFeedback({
        type: "success",
        message: `${category.name} ahora se muestra con «${photo.name}». La tienda se rehace en la próxima visita.`,
      });
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      setFeedback({ type: "error", message: message || "No se pudo cambiar la portada." });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader
        title={<>Portadas de las <i>colecciones.</i></>}
        description="Elegí con qué obra se presenta cada colección en la tienda."
        icon={<LayoutGrid aria-hidden="true" />}
      />
      {loadError && <p className="admin-feedback error">{loadError}</p>}
      {feedback && <p className={`admin-feedback ${feedback.type}`}>{feedback.message}</p>}
      {isLoading ? (
        <CollectionsSkeleton />
      ) : (
        <CollectionsList
          categories={categories}
          photos={photos}
          savingId={savingId}
          onSelect={handleSelect}
        />
      )}
    </main>
  );
}
