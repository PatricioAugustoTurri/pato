"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Euro, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KNOWN_SIZES, sizeDimensions } from "@/lib/sizes";
import AdminHeader from "../components/AdminHeader";
import AdminNav from "../components/AdminNav";
import type { AdminSize } from "../components/types";

/* Una fila del formulario. El precio se edita como texto y no como número: un
   `<input type="number">` controlado te borra el campo cuando escribís «4» para
   llegar a «40», y acá la validación real está en el servidor. */
type Row = { size: string; price: string };

export default function AdminSizesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    axios
      .get<AdminSize[]>("/api/admin/sizes")
      .then(({ data }) => {
        if (isMounted) {
          setRows(data.map(({ size, price }) => ({ size, price: String(price) })));
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No se pudo cargar la lista de precios.");
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

  /* Los tamaños que todavía se pueden agregar: los conocidos menos los que ya
     están puestos. Si no queda ninguno, el botón no se dibuja — es más honesto
     que un botón que al tocarlo no tiene nada que ofrecer. */
  const available = KNOWN_SIZES.filter((size) => !rows.some((row) => row.size === size));

  const handlePrice = (size: string, price: string) => {
    setRows((current) => current.map((row) => (row.size === size ? { ...row, price } : row)));
  };

  const handleAdd = () => {
    const next = available[0];
    if (next) {
      setRows((current) => [...current, { size: next, price: "" }]);
      setFeedback(null);
    }
  };

  const handleRemove = (size: string) => {
    setRows((current) => current.filter((row) => row.size !== size));
    setFeedback(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const { data } = await axios.put<{ size: string; price: number }[]>("/api/admin/sizes", {
        sizes: rows.map(({ size, price }) => ({ size, price: Number(price) })),
      });
      setRows(data.map(({ size, price }) => ({ size, price: String(price) })));
      setFeedback({
        type: "success",
        message: "Precios guardados. Ya rigen para todo el catálogo.",
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: string })?.error
        : null;
      setFeedback({ type: "error", message: message ?? "No se pudieron guardar los precios." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="admin-page">
      <AdminNav />
      <AdminHeader
        title={<>Tamaños y <i>precios.</i></>}
        description="Lo que cuesta cada tamaño. Rige para toda obra del catálogo por igual."
        icon={<Euro aria-hidden="true" />}
      />

      {isLoading ? (
        <p className="admin-empty">Cargando…</p>
      ) : loadError ? (
        <p className="admin-feedback error">{loadError}</p>
      ) : (
        <div className="admin-sizes">
          {feedback && <p className={`admin-feedback ${feedback.type}`}>{feedback.message}</p>}

          <div className="admin-size-rows">
            {rows.map((row) => (
              <div className="admin-size-row" key={row.size}>
                <div className="admin-size-name">
                  <strong>{row.size}</strong>
                  <small>{sizeDimensions(row.size)}</small>
                </div>

                <label className="admin-size-price">
                  <span className="admin-size-currency" aria-hidden="true">€</span>
                  <Input
                    aria-label={`Precio de ${row.size} en euros`}
                    inputMode="decimal"
                    value={row.price}
                    onChange={(event) => handlePrice(row.size, event.target.value)}
                    placeholder="0.00"
                  />
                </label>

                {/* Quitar el último tamaño dejaría el catálogo sin nada que
                    vender, así que con uno solo el botón no está. El servidor
                    lo vuelve a comprobar: esto es comodidad, no la guarda. */}
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="admin-size-remove"
                    onClick={() => handleRemove(row.size)}
                    aria-label={`Quitar ${row.size} de la venta`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="admin-size-actions">
            {available.length > 0 && (
              <Button type="button" variant="outline" className="admin-size-add" onClick={handleAdd}>
                <Plus aria-hidden="true" />
                Agregar {available[0]}
              </Button>
            )}
            <Button type="button" className="admin-submit" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando…" : "Guardar precios"}
            </Button>
          </div>

          {/* Lo que pasa al guardar, dicho antes de guardar. Un precio nuevo no
              es un dato de una pantalla: es lo que se le va a cobrar al próximo
              cliente, y quien lo toca tiene que saberlo sin tener que probar. */}
          <div className="admin-note">
            <p>
              Lo que pongas acá vale para <strong>todas</strong> las obras al mismo tiempo: el catálogo
              no tiene precios por fotografía.
            </p>
            <p>
              Quitar un tamaño lo saca de la venta en todo el sitio. Los pedidos ya hechos no se tocan:
              guardan el tamaño y el precio que se pagó.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
