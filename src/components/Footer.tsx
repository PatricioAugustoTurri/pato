"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

type SubscribeState = "idle" | "sending" | "done" | "error";

export default function Footer() {
	const [email, setEmail] = useState("");
	const [state, setState] = useState<SubscribeState>("idle");

	const subscribe = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setState("sending");

		try {
			await axios.post("/api/subscribe", { email });
			setState("done");
			setEmail("");
		} catch {
			setState("error");
		}
	};

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
				<Link href="/">Home</Link>
				<Link href="/shop">Shop</Link>
				<Link href="/destinations">Destinations</Link>
				<Link href="/about">About</Link>
			</div>

			<div className="footer-column">
				<p className="footer-label">Help</p>
				<Link href="/contact">Contact</Link>
				<Link href="/shipping">Shipping and delivery</Link>
				<Link href="/returns">Returns and exchanges</Link>
				<Link href="/faq">Frequently asked questions</Link>
			</div>

			<div className="footer-newsletter">
				<p className="footer-label">Travel letter</p>
				<p>Stories, new destinations and one photograph in your inbox.</p>
				{/* Al darse de alta, el formulario deja de estar: seguir mostrando un
				    campo vacio invita a escribir dos veces la misma direccion. */}
				{state === "done" ? (
					<p className="footer-note" role="status">You are on the list.</p>
				) : (
					<>
						<form onSubmit={subscribe}>
							<label className="sr-only" htmlFor="email">Your email</label>
							<Input
								className="footer-email-input"
								id="email"
								type="email"
								placeholder="Your email"
								required
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
							<Button
								className="footer-submit"
								size="icon"
								variant="ghost"
								type="submit"
								disabled={state === "sending"}
								aria-label="Subscribe to the travel letter"
							>
								↗
							</Button>
						</form>
						{state === "error" && (
							<p className="footer-note is-error" role="alert">
								That did not go through. Try again in a moment.
							</p>
						)}
					</>
				)}
			</div>

			<div className="footer-bottom">
				<p className="copyright">© 2026 Pato Turri</p>
				<div className="footer-legal"><Link href="/privacy">Privacy</Link></div>
			</div>
		</footer>
	);
}
