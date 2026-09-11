"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useCart from "@/hooks/use-cart";
import { Skeleton } from "@/components/ui/skeleton";

/* El mismo corte que usa el CSS para pasar de barra a drawer. */
const MOBILE_QUERY = "(max-width: 700px)";

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();
    /* Copias, no lineas. Contar `items.length` hacia que la insignia dijera 3
       mientras el carrito, que suma cantidades, decia 4 en la misma pantalla. */
    const itemCount = useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

    const drawerRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const wasOpen = useRef(false);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    /* El fondo no se mueve mientras el panel está abierto: si se moviera, al
       cerrar el usuario volvería a otro lugar de la página. */
    useEffect(() => {
        if (!menuOpen) return;
        document.body.classList.add("has-nav-open");
        return () => document.body.classList.remove("has-nav-open");
    }, [menuOpen]);

    /* Escape cierra, y el Tab no puede salirse del panel mientras tape la
       pantalla: afuera no hay nada accionable. */
    useEffect(() => {
        if (!menuOpen) return;

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
                return;
            }
            if (event.key !== "Tab") return;

            const drawer = drawerRef.current;
            if (!drawer) return;

            const focusables = drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || !drawer.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [menuOpen, closeMenu]);

    /* Al volver a ancho de escritorio los mismos enlaces son la barra de
       siempre: dejar el estado abierto escondería el drawer sin cerrarlo. */
    useEffect(() => {
        if (!menuOpen) return;
        const query = window.matchMedia(MOBILE_QUERY);
        const onChange = () => {
            if (!query.matches) closeMenu();
        };
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, [menuOpen, closeMenu]);

    /* El foco entra al panel al abrir y vuelve al botón que lo abrió al
       cerrar, nunca al principio del documento. */
    useEffect(() => {
        if (menuOpen) {
            closeButtonRef.current?.focus();
        } else if (wasOpen.current) {
            menuButtonRef.current?.focus();
        }
        wasOpen.current = menuOpen;
    }, [menuOpen]);

    return (
        <nav className={`site-nav ${menuOpen ? "is-menu-open" : ""}`} aria-label="Navegacion principal">
            <Link className="wordmark" href="/" aria-label="Volver al inicio">
                <span>Pato</span>
                <em>Turri</em>
            </Link>

            {/* Todo lo que no es el panel cierra el panel. */}
            <div
                className={`nav-scrim ${menuOpen ? "is-open" : ""}`}
                aria-hidden="true"
                onClick={closeMenu}
            />

            <div
                ref={drawerRef}
                id="site-menu"
                className={`nav-links ${menuOpen ? "is-open" : ""}`}
            >
                <div className="nav-drawer-head">
                    <Button
                        ref={closeButtonRef}
                        className="nav-drawer-close"
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label="Close menu"
                        onClick={closeMenu}
                    >
                        <X aria-hidden="true" />
                    </Button>
                </div>

                <Link href="/" onClick={closeMenu}>Home</Link>
                <Link href="/shop" onClick={closeMenu}>Shop</Link>
                <Link href="/about" onClick={closeMenu}>About</Link>
                <Link href="/contact" onClick={closeMenu}>Contact</Link>

                {/* En la barra estas dos acciones quedan reducidas a iconos sin
                    nombre; acá recuperan su etiqueta. */}
                <div className="nav-drawer-actions">
                    <Link className="nav-drawer-action" href={session ? "/account" : "/login"} onClick={closeMenu}>
                        <User aria-hidden="true" />
                        <span>{status === "loading" ? <Skeleton className="h-3 w-20" /> : session ? session.user?.name : "Sign in"}</span>
                    </Link>
                    <Link className="nav-drawer-action" href="/cart" onClick={closeMenu}>
                        <ShoppingCart aria-hidden="true" />
                        <span>Cart</span>
                        <b>{itemCount}</b>
                    </Link>
                </div>
            </div>

            <div className="nav-actions">
                <Button
                    className="account-button"
                    variant="ghost"
                    type="button"
                    aria-label={session ? "Ver mi cuenta" : "Iniciar sesión"}
                    onClick={() => router.push(session ? "/account" : "/login")}
                >
                    <span className="account-icon" aria-hidden="true"><User /></span>
                    <span>
                        {status === "loading" ? <Skeleton className="h-3 w-14" /> : session ? session.user?.name : "Ingresar"}
                    </span>
                </Button>
                <Button className="bag-button" variant="ghost" type="button" aria-label={`Open cart (${itemCount} ${itemCount === 1 ? "print" : "prints"})`} onClick={() => router.push("/cart")}>
                    <span aria-hidden="true"><ShoppingCart /></span>
                    <b>{itemCount}</b>
                </Button>
                <Button
                    ref={menuButtonRef}
                    className="menu-button"
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                    aria-controls="site-menu"
                    onClick={() => setMenuOpen(true)}
                >
                    <span />
                    <span />
                </Button>
            </div>
        </nav>
    );
}

export default NavBar;
