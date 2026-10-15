"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import AdminNav from "../components/AdminNav";
import FeaturedList, { type Flag } from "./components/FeaturedList";
import PhotosGridSkeleton from "../components/PhotosGridSkeleton";
import type { AdminPhoto } from "../components/types";

/* Las dos franjas curadas de la portada, cada una con la marca que la llena y
   una frase que dice qué hace, escrita para quien la va a tocar y no para quien
   escribió la columna. */
const TABS: { flag: Flag; label: string; note: string }[] = [
  {
    flag: "preferidos",
    label: "My best memories",
    note:
      "La franja de países de la portada. Un país entra si tiene al menos una obra marcada acá, y la primera marcada es la que abre su capítulo, más grande que las otras.",
  },
  {
    flag: "oferta",
    label: "This month's selection",
    note:
      "Las tres obras de la selección del mes. La primera marcada es la que ocupa la columna grande.",
  },
];

export default function AdminFeaturedPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [flag, setFlag] = useState<Flag>("preferidos");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    axios
      .get<AdminPhoto[]>("/api/admin/photos")
      .then(({ data }) => {
        if (isMounted) {
          setPhotos(data);
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

  /* Agrupadas por país, porque así es como se leen en la portada: el país es el
     encabezado de cada capítulo. Las que no tienen país van juntas al final con
     el nombre dicho, y no escondidas: una obra sin país no puede entrar en la
     franja por más que se la marque, y eso hay que poder verlo. */
  const groups = useMemo(() => {
    const byCountry = new Map<string, AdminPhoto[]>();

    for (const photo of photos) {
      const country = photo.pais?.trim() || "Sin país";
      byCountry.set(country, [...(byCountry.get(country) ?? []), photo]);
    }

    return Array.from(byCountry, ([country, list]) => ({ country, photos: list })).sort((a, b) => {
      if (a.country === "Sin país") return 1;
      if (b.country === "Sin país") return -1;
      return a.country.localeCompare(b.country, "es");
    });
  }, [photos]);

  const handleToggle = async (photo: AdminPhoto) => {
    const next = !photo[flag];
    setSavingId(photo.id);
    setFeedback(null);

    try {
      const { data } = await axios.patch<{ id: number; preferidos: boolean; oferta: boolean }>(
        `/api/admin/photos/${photo.id}`,
        { [flag]: next },
      );
      setPhotos((current) =>
        current.map((item) =>
          item.id === photo.id ? { ...item, preferidos: data.preferidos, oferta: data.oferta } : item,
        ),
      );
      setFeedback({
        type: "success",
        message: `«${photo.name}» ${next ? "entra en" : "sale de"} la portada.`,
      });
    } catch {
      setFeedback({ type: "error", message: "No se pudo cambiar la marca." });
    } finally {
      setSavingId(null);
    }
  };

  const active = TABS.find((tab) => tab.flag === flag) ?? TABS[0];

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader
        title={<>Qué se ve en la <i>portada.</i></>}
        description="Marcá las obras que llenan las dos franjas curadas de la página de inicio."
        icon={<Star aria-hidden="true" />}
      />

      {loadError && <p className="admin-feedback error">{loadError}</p>}

      <div className="admin-featured-tabs" role="tablist" aria-label="Franja de la portada">
        {TABS.map((tab) => (
          <button
            key={tab.flag}
            type="button"
            role="tab"
            aria-selected={tab.flag === flag}
            className={`admin-featured-tab${tab.flag === flag ? " is-active" : ""}`}
            onClick={() => {
              setFlag(tab.flag);
              setFeedback(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="admin-featured-note">{active.note}</p>

      {feedback && <p className={`admin-feedback ${feedback.type}`}>{feedback.message}</p>}

      {isLoading ? (
        <PhotosGridSkeleton />
      ) : groups.length === 0 ? (
        <p className="admin-empty">Todavía no hay fotografías cargadas.</p>
      ) : (
        <FeaturedList groups={groups} savingId={savingId} flag={flag} onToggle={handleToggle} />
      )}
    </main>
  );
}
