import { Skeleton } from "@/components/ui/skeleton";

type AuthFormSkeletonProps = {
  /** Cuántos campos dibuja la puerta: dos para ingresar, tres para registrarse. */
  fields?: number;
  /** La nota del mínimo de contraseña, bajo el último campo. */
  hint?: boolean;
  /** El enlace a la otra puerta. El admin no tiene otra puerta. */
  switchLink?: boolean;
};

/**
 * El hueco del mostrador mientras `useSearchParams` suspende.
 *
 * Dibuja el mostrador y no la página entera: la pared y el título salen del
 * servidor, así que lo único que llega tarde es esto. Y usa las clases reales
 * —`.auth-form`, `.auth-field`, `.auth-switch`— en vez de alturas
 * copiadas a mano: así las medidas las calcula el mismo CSS que va a gobernar
 * el formulario de verdad, y no hay forma de que las dos versiones difieran.
 * Cada puerta pasa su propia forma, porque no todas tienen las mismas piezas:
 * el registro suma un campo y su nota, y el admin no lleva el enlace a la otra
 * puerta. Reservar una pieza que la pantalla no dibuja mueve todo al hidratar.
 */
export default function AuthFormSkeleton({
  fields = 2,
  hint = false,
  switchLink = false,
}: AuthFormSkeletonProps) {
  return (
    <div className="auth-counter-inner" aria-hidden="true">
      <div className="auth-form">
        {Array.from({ length: fields }, (_, index) => (
          <div className="auth-field" key={index}>
            <Skeleton className="h-[13px] w-16" />
            <Skeleton className="h-[46px] w-full" />
            {hint && index === fields - 1 && <Skeleton className="h-[14px] w-32" />}
          </div>
        ))}
        <Skeleton className="mt-1 h-[46px] w-full" />
      </div>
      {switchLink && <p className="auth-switch">&nbsp;</p>}
    </div>
  );
}
