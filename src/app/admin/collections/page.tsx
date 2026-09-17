"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHeader from "../components/AdminHeader";
import AdminNav from "../components/AdminNav";
import CollectionForm, { type CollectionDraft } from "./components/CollectionForm";
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
  /* `null` es el formulario cerrado, `"new"` es el alta y una colección es su
     edición. Un solo estado y no tres booleanos: así no existe el estado
     imposible de estar creando y editando a la vez. */
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);

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

  /* Un solo camino para las dos cosas: POST cuando es alta, PATCH cuando es
     edición. La lista se actualiza en memoria con lo que contestó el servidor,
     no con lo que se tipeó: el nombre puede volver recortado y el slug lo
     calcula él. */
  const handleSubmitForm = async (draft: CollectionDraft) => {
    setIsSavingForm(true);
    setFeedback(null);

    try {
      if (editing === "new") {
        const { data } = await axios.post<AdminCategory>("/api/admin/categories", draft);
        setCategories((current) =>
          [...current, { ...data, descripcion: draft.descripcion || null }].sort((a, b) =>
            a.name.localeCompare(b.name, "es"),
          ),
        );
        setFeedback({
          type: "success",
          message: `«${data.name}» creada. Todavía no tiene obras: cargalas desde Fotografías y después elegí su portada.`,
        });
      } else if (editing) {
        const { data } = await axios.patch<{ id: number; name: string; descripcion: string | null }>(
          `/api/admin/categories/${editing.id}`,
          draft,
        );
        setCategories((current) =>
          current
            .map((item) =>
              item.id === editing.id
                ? { ...item, name: data.name, descripcion: data.descripcion }
                : item,
            )
            .sort((a, b) => a.name.localeCompare(b.name, "es")),
        );
        setFeedback({ type: "success", message: `«${data.name}» guardada.` });
      }

      setEditing(null);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      setFeedback({ type: "error", message: message || "No se pudo guardar la colección." });
    } finally {
      setIsSavingForm(false);
    }
  };

  /* La confirmación es del navegador y no una pantalla propia a propósito:
     borrar una colección es raro y ya está defendido del lado del servidor, que
     se niega si adentro queda una obra. Una pantalla de confirmación es para lo
     que se hace seguido. */
  const handleDelete = async (category: AdminCategory) => {
    if (!window.confirm(`¿Borrar la colección «${category.name}»? No se puede deshacer.`)) {
      return;
    }

    setSavingId(category.id);
    setFeedback(null);

    try {
      await axios.delete(`/api/admin/categories/${category.id}`);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setFeedback({ type: "success", message: `«${category.name}» borrada.` });
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      setFeedback({ type: "error", message: message || "No se pudo borrar la colección." });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader
        title={<>Las <i>colecciones.</i></>}
        description="Creá colecciones, escribí su texto y elegí con qué obra se presenta cada una en la tienda."
        icon={<LayoutGrid aria-hidden="true" />}
      />
      {loadError && <p className="admin-feedback error">{loadError}</p>}
      {feedback && <p className={`admin-feedback ${feedback.type}`}>{feedback.message}</p>}

      {editing ? (
        <CollectionForm
          /* La `key` es lo que hace que saltar de una colección a otra traiga
             sus campos: cambia, y React monta el formulario de cero. */
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? undefined : editing}
          isSaving={isSavingForm}
          onSubmit={handleSubmitForm}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="admin-library-heading">
          <h2>{categories.length === 1 ? "1 colección" : `${categories.length} colecciones`}</h2>
          <Button type="button" className="admin-new-photo" onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" />
            Nueva colección
          </Button>
        </div>
      )}

      {isLoading ? (
        <CollectionsSkeleton />
      ) : (
        <CollectionsList
          categories={categories}
          photos={photos}
          savingId={savingId}
          onSelect={handleSelect}
          onEdit={(category) => {
            setEditing(category);
            setFeedback(null);
          }}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}
