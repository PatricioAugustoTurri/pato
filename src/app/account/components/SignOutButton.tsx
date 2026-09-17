"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

/* La única isla de cliente de la página. No lleva `<Suspense>` alrededor —a
   diferencia de los formularios de las puertas— porque no lee parámetros de la
   URL ni nada que suspenda: envolverla sería repetir el patrón sin el motivo
   que lo justifica. */
export default function SignOutButton() {
  const router = useRouter();

  /* `signOut()` con su redirección puesta hace dos cosas distintas en una: le
     pide al endpoint que cierre la sesión y después navega con
     `window.location.href` a la URL **absoluta** que ese endpoint le devuelve
     —`http://localhost:3000/` en local, `https://patoturri.com/` publicado,
     armada con el `Host` que le llega al servidor detrás del proxy—.

     Esa segunda parte es una carga de documento nueva, por fuera del router y
     contra una dirección escrita entera. Cuando el navegador no puede abrirla
     —el host que arma el proxy, una conexión que ya no está— se queda en su
     propia página de "sin conexión" con la sesión ya cerrada: el síntoma
     reportado, cerrar sesión bien y aterrizar en una página que no carga.

     Partido en dos no queda ninguna URL absoluta en el medio. El endpoint
     cierra la sesión y avisa a `SessionProvider` —por eso la barra de arriba
     deja de mostrar la cuenta sin necesidad de recargar— y la navegación la
     hace el router sobre el origen en el que ya estamos. `replace` y no `push`
     porque volver atrás a la cuenta recién cerrada no lleva a ningún lado.
     `refresh` porque la portada la dibuja el servidor: sin él se podría
     recuperar del caché del cliente como estaba mientras había sesión.

     El aviso va antes de navegar y se lee en la portada: el `<Toaster>` vive en
     el layout raíz, que una navegación del router no desmonta. Con la carga de
     documento de antes esto no era posible —el toast se moría con la página que
     lo había pedido—, así que el aviso existe gracias al cambio de arriba. */
  async function handleSignOut() {
    await signOut({ redirect: false });
    toast("Signed out");
    router.replace("/");
    router.refresh();
  }

  return (
    <button className="order-signout" type="button" onClick={handleSignOut}>
      <span className="order-signout-rule">Sign out</span>
    </button>
  );
}
