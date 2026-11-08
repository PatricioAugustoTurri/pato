/* La bolsa de la tienda es una cámara: lo que se lleva de acá son fotos.

   Telemétrica de cuerpo chato —visor arriba a la izquierda, lente corrido a
   la derecha, disparador sobre el lomo— dibujada con el mismo trazo de 1.5
   que los íconos de lucide que tiene al lado, para que no parezca de otra
   familia. La esquina de arriba a la derecha queda libre a propósito: ahí se
   apoya la cifra.

   Cada pieza que se mueve tiene su clase (`cam-shutter`, `cam-finder`,
   `cam-iris`); el gesto vive en globals.css, en "La cámara del carrito". */
export default function CameraIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <rect className="cam-shutter" x="11.25" y="4.5" width="3.5" height="2.5" rx=".6" />
            <rect x="2.25" y="7" width="19.5" height="12.75" rx="2.25" />
            <rect className="cam-finder" x="4.75" y="9.25" width="3.75" height="2.25" rx=".45" />
            <circle cx="14" cy="13.6" r="4" />
            <circle className="cam-iris" cx="14" cy="13.6" r="3.95" fill="currentColor" stroke="none" />
            <circle cx="14" cy="13.6" r="1.6" />
        </svg>
    );
}
