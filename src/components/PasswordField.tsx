"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

/* El `type` no se recibe: lo gobierna el ojo. Dejarlo pasar desde afuera
   permitiria montar un campo de contraseña que nace en texto plano. */
type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type">;

/**
 * El campo de contraseña de las tres puertas: ingresar, registrarse y el panel.
 *
 * Escribir a ciegas es la causa mas comun de un rechazo que no era tal —la
 * contraseña estaba bien y sobraba una mayuscula del teclado del telefono—, y
 * el formulario no puede distinguir ese caso de una credencial equivocada: el
 * servidor contesta lo mismo a los dos a proposito. Asi que la unica forma de
 * resolverlo es del lado del visitante, dejandole ver lo que tecleo.
 *
 * Vive en un componente y no copiado en cada formulario porque son tres, y
 * porque el detalle que lo hace seguro —el `type="button"`— es invisible: sin
 * el, el boton hereda el `submit` por defecto y tocar el ojo envia el
 * formulario a medio llenar. Un error asi se copia igual de bien que el resto.
 */
export default function PasswordField(props: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const action = revealed ? "Hide password" : "Show password";

  return (
    <div className="auth-password">
      <Input {...props} type={revealed ? "text" : "password"} />
      {/* La etiqueta cambia con el estado en vez de anunciarse como interruptor
          con `aria-pressed`: "Show password, pressed" obliga a deducir si lo
          apretado es mostrar u ocultar. El verbo solo ya dice que va a pasar. */}
      <button
        type="button"
        className="auth-reveal"
        onClick={() => setRevealed((shown) => !shown)}
        aria-label={action}
        title={action}
      >
        {revealed ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}
