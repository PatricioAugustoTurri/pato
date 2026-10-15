import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Qué puede recorrer un buscador.
 *
 * Acá solo se bloquea lo que no tiene ninguna página que leer. Todo lo demás
 * que no queremos en el índice —el carrito, la cuenta, el panel, las dos
 * puertas de acceso— se marca con `noindex` en su propia página, y NO se
 * bloquea acá: las dos cosas juntas se anulan. Un `Disallow` impide que Google
 * entre, y si no entra nunca lee el `noindex`, así que la dirección puede
 * terminar igual en el índice —vacía, sin título— porque alguien la enlazó.
 * Dejarlo entrar para que lea la orden y se vaya es lo que de verdad la saca.
 *
 * Tampoco se nombra `/admin` acá a propósito: `robots.txt` es público, y no
 * hace falta publicar dónde está la puerta del autor.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* Rutas sin HTML que leer: solo gastan presupuesto de rastreo. */
      disallow: ["/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
