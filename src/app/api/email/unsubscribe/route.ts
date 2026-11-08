import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { unsubscribeEmail } from "@/lib/email-marketing/unsubscribe";

// Baja "en un clic" (RFC 8058): Gmail y Apple Mail muestran un botón
// "Anular suscripción" que hace POST acá sin abrir el sitio.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenant = await getCurrentTenant();
  if (!tenant) return new Response("Not found", { status: 404 });
  const ok = await unsubscribeEmail(tenant.id, url.searchParams.get("e") ?? "", url.searchParams.get("t") ?? "");
  return new Response(ok ? "OK" : "Link inválido", { status: ok ? 200 : 400 });
}

// Si alguien abre el link en el navegador, va a la página de confirmación.
export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/baja${url.search}`, url));
}
