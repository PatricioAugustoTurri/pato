"use client";

import { signOut } from "next-auth/react";

/* La única isla de cliente de la página. No lleva `<Suspense>` alrededor —a
   diferencia de los formularios de las puertas— porque no lee parámetros de la
   URL ni nada que suspenda: envolverla sería repetir el patrón sin el motivo
   que lo justifica. */
export default function SignOutButton() {
  return (
    <button className="order-signout" type="button" onClick={() => signOut({ redirectTo: "/" })}>
      <span className="order-signout-rule">Sign out</span>
    </button>
  );
}
