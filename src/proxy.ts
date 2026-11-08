import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Cookie anónima (sin datos personales) para distinguir visitantes.
const VISITOR_COOKIE = "urbi_vid";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const existingVisitorId = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId ?? randomUUID();
  if (visitorId) requestHeaders.set("x-visitor-id", visitorId);

  // El manifest y los íconos de la PWA del admin tienen que poder pedirse
  // sin sesión: iOS Safari busca el apple-touch-icon con un mecanismo propio
  // que no manda la cookie — si esto quedara detrás del login, recibe un
  // redirect en vez de la imagen y cae al ícono genérico con la inicial del
  // nombre. No expone nada sensible (nombre y logo ya son públicos), así
  // que no hace falta el gate de ADMIN acá.
  const isPublicAdminAsset =
    pathname === "/admin/manifest.webmanifest" ||
    pathname.startsWith("/admin/icon/");
  const isAdminRoute = pathname.startsWith("/admin") && !isPublicAdminAsset;

  let response: NextResponse;
  if (!isAdminRoute) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    const user = req.auth?.user;
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      response = NextResponse.redirect(loginUrl);
    } else if (user.role !== "ADMIN" && user.role !== "AGENT") {
      response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  if (visitorId && !existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
});

export const config = {
  // Sin excluir /uploads/ (fotos, logos, favicons) y el resto de los
  // archivos estáticos, el proxy corre sobre ellos igual que sobre
  // cualquier página — la doc de Next.js (proxy.md) avisa exactamente de
  // esto: "auth logic or redirects can unintentionally block CSS, JS, or
  // images from loading".
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml)$).*)",
  ],
};
