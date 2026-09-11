import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname === "/api/checkout") {
    if (!req.auth) {
      return NextResponse.json({ error: "You need to sign in to buy." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!req.auth) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "No autorizado." }, { status: 401 });
      }

      const loginUrl = new URL("/admin/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (req.auth.user?.role !== "admin") {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/checkout"],
};
