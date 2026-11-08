import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const realHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const realProtocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const realOrigin = `${realProtocol}://${realHost}`;
  const requestedReturn = request.nextUrl.searchParams.get("returnTo");
  let returnTo = realOrigin;

  // Solo permitimos volver al mismo origen que inició el cierre. Evita que
  // este endpoint se convierta en un redirect abierto hacia otro sitio.
  if (requestedReturn) {
    try {
      const parsed = new URL(requestedReturn);
      if (parsed.origin === realOrigin) returnTo = parsed.origin;
    } catch {
      // Un destino inválido simplemente vuelve al origen actual.
    }
  }

  const localLogout = new URL("/api/auth/logout-local", realOrigin);
  localLogout.searchParams.set("next", returnTo);
  return NextResponse.redirect(localLogout);
}
