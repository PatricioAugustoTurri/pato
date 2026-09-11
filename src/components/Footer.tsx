"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="site-footer" id="contacto">
			<div className="footer-brand">
				<span>Pato</span>
				<em>Turri</em>
				<p>Fotografias para volver</p>
			</div>

			<div className="footer-column">
				<p className="footer-label">Explora</p>
				<Link href="/">Home</Link>
				<Link href="/shop">Shop</Link>
				<Link href="/destinos">Destinos</Link>
				<Link href="/about">About</Link>
			</div>

			<div className="footer-column">
				<p className="footer-label">Ayuda</p>
				<Link href="/contact">Contacto</Link>
				<Link href="/eye">Envios y entregas</Link>
				<Link href="/cyd">Cambios y devoluciones</Link>
				<Link href="/faqs">Preguntas frecuentes</Link>
			</div>

			<div className="footer-newsletter">
				<p className="footer-label">Carta de viaje</p>
				<p>Historias, nuevos destinos y una fotografia para tu bandeja de entrada.</p>
				<form>
					<label className="sr-only" htmlFor="email">Tu email</label>
					<Input className="footer-email-input" id="email" type="email" placeholder="Tu email" />
					<Button className="footer-submit" size="icon" variant="ghost" type="submit" aria-label="Suscribirse al newsletter" onClick={(e) => e.preventDefault()}>
						↗
					</Button>
				</form>
			</div>

			<div className="footer-bottom">
				<p className="copyright">© 2026 Pato Turri</p>
				<div className="footer-legal"><Link href="https://www.instagram.com">Instagram</Link><Link href="/privacidad">Privacidad</Link></div>
			</div>
		</footer>
	);
}
