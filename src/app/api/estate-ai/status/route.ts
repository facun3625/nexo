import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { getAssistantStatus } from "@/lib/ai-agent/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Sitio no disponible" }, { status: 503 });

  return NextResponse.json(await getAssistantStatus(tenant.id), {
    headers: { "Cache-Control": "no-store" },
  });
}
