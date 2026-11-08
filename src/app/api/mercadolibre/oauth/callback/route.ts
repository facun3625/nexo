import { NextRequest, NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/require-admin";
import { exchangeCodeForTokens } from "@/lib/mercadolibre/auth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ml_oauth_state";

export async function GET(request: NextRequest) {
  const { tenant } = await requireTenantAdmin();
  const redirectTo = new URL("/admin/configuracion", request.nextUrl.origin);
  redirectTo.searchParams.set("tab", "mercadolibre");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const mlError = request.nextUrl.searchParams.get("error");

  if (mlError) {
    redirectTo.searchParams.set("mlError", mlError);
    return NextResponse.redirect(redirectTo);
  }
  if (!code || !state || state !== expectedState) {
    redirectTo.searchParams.set("mlError", "state_invalido");
    return NextResponse.redirect(redirectTo);
  }

  try {
    await exchangeCodeForTokens(tenant.id, code);
    redirectTo.searchParams.set("mlConnected", "1");
  } catch (err) {
    redirectTo.searchParams.set("mlError", err instanceof Error ? err.message : "error_desconocido");
  }

  const response = NextResponse.redirect(redirectTo);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
