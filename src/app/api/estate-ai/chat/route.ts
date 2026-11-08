import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { getAiAssistantSettings } from "@/lib/settings";
import { buildAssistantInstructions } from "@/lib/ai-agent/prompt";
import { runAssistantProvider } from "@/lib/ai-agent/provider";
import { getCatalogSummary } from "@/lib/ai-agent/tools";
import { DEFAULT_AI_MODELS } from "@/lib/ai-agent/types";
import { parseAssistantRequest } from "@/lib/ai-agent/validation";
import { isRateLimited, recordFailure, clientIp, type RateLimitRule } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CHAT_RULE: RateLimitRule = { limit: 20, windowMinutes: 1 };
const CHAT_IP_RULE: RateLimitRule = { limit: 40, windowMinutes: 1 };

export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Sitio no disponible" }, { status: 503 });

  const ipKey = `ai-chat-ip:${clientIp(request.headers)}`;
  if (await isRateLimited(ipKey, CHAT_IP_RULE)) {
    return NextResponse.json(
      { error: "Mandaste varios mensajes seguidos. Esperá un momento y volvé a intentar." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000) {
    return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }

  let parsed: { sessionId: string; message: string };
  try {
    parsed = parseAssistantRequest(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Solicitud inválida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const sessionKey = `ai-chat-session:${tenant.id}:${parsed.sessionId}`;
  if (await isRateLimited(sessionKey, CHAT_RULE)) {
    return NextResponse.json(
      { error: "Mandaste varios mensajes seguidos. Esperá un momento y volvé a intentar." },
      { status: 429 },
    );
  }
  await Promise.all([recordFailure(ipKey), recordFailure(sessionKey)]);

  const settings = await getAiAssistantSettings(tenant.id);
  if (!settings.enabled || !settings.provider || !settings.apiKey) {
    return NextResponse.json({ error: "El asistente no está disponible." }, { status: 503 });
  }

  const existing = await prisma.estateAiConversation.findUnique({
    where: { tenantId_sessionId: { tenantId: tenant.id, sessionId: parsed.sessionId } },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { role: true, content: true },
      },
    },
  });
  const history = [
    ...(existing?.messages ?? []).reverse().map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
    { role: "user" as const, content: parsed.message },
  ];

  const startedAt = Date.now();
  const model = settings.model || DEFAULT_AI_MODELS[settings.provider];
  try {
    const reply = await runAssistantProvider(settings.provider, tenant.id, {
      apiKey: settings.apiKey,
      model,
      instructions: buildAssistantInstructions(settings.instructions, await getCatalogSummary(tenant.id)),
      history,
    });
    // Para medir la demora desde pm2 logs: grep "estate-ai chat ok".
    console.info(`estate-ai chat ok ${settings.provider}/${model} ${Date.now() - startedAt}ms`);
    const cleanReply = reply.text.trim().slice(0, 5_000);
    const conversation = await prisma.estateAiConversation.upsert({
      where: { tenantId_sessionId: { tenantId: tenant.id, sessionId: parsed.sessionId } },
      create: { tenantId: tenant.id, sessionId: parsed.sessionId },
      // lastMessageAt ordena /admin/conversaciones; handledAt vuelve a null porque hay algo nuevo para revisar.
      update: { lastMessageAt: new Date(), handledAt: null },
      select: { id: true },
    });
    await prisma.estateAiMessage.createMany({
      data: [
        { conversationId: conversation.id, role: "user", content: parsed.message },
        {
          conversationId: conversation.id,
          role: "assistant",
          content: cleanReply,
          propertyIds: reply.properties.map((property) => property.id),
        },
      ],
    });

    return NextResponse.json({ message: cleanReply, properties: reply.properties });
  } catch (error) {
    console.error("estate-ai chat request failed", error);
    return NextResponse.json(
      { error: "No pude responder ahora. Probá nuevamente en un momento." },
      { status: 502 },
    );
  }
}
