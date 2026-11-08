import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3011";

function safeNext(value: string | null) {
  const protocol = ROOT_DOMAIN.startsWith("localhost") ? "http" : "https";
  const fallback = `${protocol}://${ROOT_DOMAIN}`;
  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    const rootHost = ROOT_DOMAIN.split(":")[0];
    if (url.hostname === rootHost || url.hostname.endsWith(`.${rootHost}`)) return url.toString();
    return fallback;
  } catch {
    return fallback;
  }
}

// Se ejecuta una vez en cada host. Al responder desde ese mismo host el
// navegador acepta la expiración de sus cookies host-only; ningún dominio
// intenta borrar cookies ajenas.
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(safeNext(request.nextUrl.searchParams.get("next")));
  for (const cookie of request.cookies.getAll()) {
    if (
      cookie.name.includes("nexo.session-token") ||
      cookie.name.includes("authjs.session-token") ||
      cookie.name.includes("next-auth.session-token")
    ) {
      // cookies().delete(name) no manda el atributo Secure — para un
      // nombre con prefijo __Secure-/__Host- (el caso en producción, HTTPS)
      // el navegador rechaza en silencio cualquier Set-Cookie de ese nombre
      // que no lo incluya, así que el borrado no hacía nada. Hay que setear
      // el cookie vacío a mano con los mismos atributos con que se creó.
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: cookie.name.startsWith("__Secure-") || cookie.name.startsWith("__Host-"),
      });
    }
  }
  return response;
}
