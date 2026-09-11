"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

/* La G oficial de Google, dibujada. Es el unico logo a cuatro colores del
   sitio y va asi a proposito: la marca de un tercero se reproduce como es, no
   se repinta para que combine. Por eso tampoco hereda `currentColor`. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M47.5 24.55c0-1.63-.15-3.2-.42-4.7H24.5v8.9h12.9c-.56 3-2.24 5.54-4.78 7.24v6.02h7.74c4.53-4.17 7.14-10.31 7.14-17.46Z"
      />
      <path
        fill="#34A853"
        d="M24.5 48c6.48 0 11.92-2.15 15.89-5.82l-7.74-6.01c-2.15 1.44-4.9 2.29-8.15 2.29-6.26 0-11.57-4.22-13.47-9.91H3.03v6.2C6.98 42.58 15.1 48 24.5 48Z"
      />
      <path
        fill="#FBBC05"
        d="M11.03 28.55a14.4 14.4 0 0 1 0-9.1v-6.2H3.03a24 24 0 0 0 0 21.5l8-6.2Z"
      />
      <path
        fill="#EA4335"
        d="M24.5 9.55c3.53 0 6.7 1.21 9.19 3.59l6.88-6.88C36.41 2.38 30.98 0 24.5 0 15.1 0 6.98 5.42 3.03 13.25l8 6.2c1.9-5.69 7.21-9.9 13.47-9.9Z"
      />
    </svg>
  );
}

export default function GoogleSignIn({ callbackUrl, label }: { callbackUrl: string; label: string }) {
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        className="google-button"
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          /* Redirección real, no `redirect: false`: el flujo de OAuth vive en
             Google, así que la página se va y vuelve. Si algo falla, NextAuth
             devuelve al visitante acá con el error en la URL. */
          signIn("google", { callbackUrl });
        }}
      >
        <GoogleMark />
        {pending ? "Abriendo Google…" : label}
      </button>
      {/* Separador con la palabra adentro: dice que son dos caminos al mismo
          lugar, no dos formularios distintos. */}
      <div className="auth-or"><span>o con tu email</span></div>
    </>
  );
}
