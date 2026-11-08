import { NextRequest } from "next/server";

import { handlers } from "@/auth";

// Next.js entrega `req.url` con el host aplastado al del servidor
// (http://localhost:3010) aunque el navegador haya pedido
// tienda1.urbi.com.ar — los headers `host`/`x-forwarded-host` sí traen el
// host real. Auth.js arma toda su identidad a partir de `req.url`, así que
// sin esto cree que TODAS las tiendas son el dominio raíz, y entonces:
//   - da por hecho que ya está en el redirect proxy, y no guarda el origen
//     dentro del `state` firmado;
//   - al volver de Google no tiene a dónde rebotar, procesa el callback en
//     el dominio raíz y busca ahí las cookies de state/PKCE, que el
//     navegador dejó en el subdominio → "InvalidCheck: state value could
//     not be parsed".
// Reponiendo el host real, cada tienda vuelve a ser su propio origen: el
// login arranca y termina en el mismo dominio (sea subdominio o dominio
// propio de un cliente) y Google sigue teniendo un único redirect URI.
function withRealHost(handler: (req: NextRequest) => Promise<Response>) {
  return (req: NextRequest) => {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!host) return handler(req);

    const url = new URL(req.url);
    if (url.host === host) return handler(req);

    // hostname + port por separado, NO `url.host = host`: el setter de `host`
    // se queda con el puerto viejo cuando el valor nuevo no trae uno. Detrás
    // de un proxy en HTTPS el header viene sin puerto (443 es implícito), así
    // que `host = "tienda.urbi.com.ar"` sobre la URL interna
    // http://localhost:3014/... daba tienda.urbi.com.ar:3014 — un puerto que
    // desde afuera no responde. Auth.js armaba con eso todos sus redirects:
    // el signout mandaba el navegador a la nada, y el login se colgaba porque
    // el fetch seguía ese redirect hasta agotar el timeout. En local nunca se
    // ve, porque ahí el puerto (3010) no es estándar y el header sí lo trae.
    const [hostname, port = ""] = host.split(":");
    url.hostname = hostname;
    url.port = port;
    url.protocol = req.headers.get("x-forwarded-proto") ?? url.protocol;
    return handler(new NextRequest(url, req));
  };
}

export const GET = withRealHost(handlers.GET);
export const POST = withRealHost(handlers.POST);
