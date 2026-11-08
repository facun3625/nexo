import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { parseContactRequest } from "@/lib/ai-agent/validation";
import { isRateLimited, recordFailure, clientIp, type RateLimitRule } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CONTACT_IP_RULE: RateLimitRule = { limit: 10, windowMinutes: 1 };

// Guarda el nombre y el teléfono que el visitante deja al abrir el chat del
// asistente, en su conversación — para que el equipo lo pueda contactar por
// WhatsApp si la IA no resuelve la consulta.
export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Sitio no disponible" }, { status: 503 });

  const ipKey = `ai-contact-ip:${clientIp(request.headers)}`;
  if (await isRateLimited(ipKey, CONTACT_IP_RULE)) {
    return NextResponse.json({ error: "Probá de nuevo en un momento." }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") || 0) > 4_000) {
    return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }
  await recordFailure(ipKey);

  let parsed: { sessionId: string; name: string; phone: string };
  try {
    parsed = parseContactRequest(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Solicitud inválida" }, { status: 400 });
  }

  await prisma.estateAiConversation.upsert({
    where: { tenantId_sessionId: { tenantId: tenant.id, sessionId: parsed.sessionId } },
    create: { tenantId: tenant.id, sessionId: parsed.sessionId, name: parsed.name, phone: parsed.phone },
    update: { name: parsed.name, phone: parsed.phone },
  });
  return NextResponse.json({ ok: true });
}
