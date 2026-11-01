import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { SELLER } from "@/lib/seller";
import { JOURNEY, JOURNEY_LABEL } from "@/lib/journey";

/* La tienda es solo la tienda (2026-11-01): la historia, el contacto y lo que
   cuenta el viaje viven en Rumbo Oeste. Acá queda lo que sirve para comprar:
   el catálogo, los destinos, y las condiciones y la privacidad, que es donde
   están los envíos y las devoluciones. */
export default function Footer() {
	return (
		<footer className="site-footer" id="contacto">
			<div className="footer-brand">
				<span>Pato</span>
				<em>Turri</em>
				<p>Photographs to come back to</p>
				{/* Bajo la firma, no en la franja legal: son identidad, no letra
				    chica, y aca tienen sitio para los 44px de area tocable. */}
				<SocialLinks className="footer-social" />
			</div>

			<div className="footer-column">
				<p className="footer-label">Explore</p>
				{JOURNEY ? (
					/* `/` es Rumbo Oeste, otra app: va un <a> y no <Link> (ver lib/journey.ts). */
					// eslint-disable-next-line @next/next/no-html-link-for-pages
					<a className="nav-journey" href="/">{JOURNEY_LABEL}</a>
				) : (
					<Link href="/">Home</Link>
				)}
				<Link href="/shop">Shop</Link>
				<Link href="/destinations">Destinations</Link>
			</div>

			<div className="footer-bottom">
				{/* Quién vende y en qué condición fiscal, a la vista en cada página:
				    es lo primero que busca quien duda antes de pagar a una tienda
				    que no conoce. Sale de `@/lib/seller`, igual que /terms. */}
				<p className="copyright">© 2026 Pato Turri · {SELLER.footerLine}</p>
				<div className="footer-legal">
					<Link href="/terms">Terms of sale</Link>
					<Link href="/privacy">Privacy</Link>
					{/* Sin página de contacto, la dirección queda a la vista en cada
					    página: quien compra a distancia tiene que poder escribirle al
					    vendedor. */}
					<a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
				</div>
			</div>
		</footer>
	);
}
