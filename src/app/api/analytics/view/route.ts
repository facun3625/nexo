import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  path: z.string().startsWith("/").max(500),
  referrer: z.string().url().max(2000).nullable().optional(),
});

export async function POST(request: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return new NextResponse(null, { status: 204 });

  const parsed = payloadSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success || parsed.data.path.startsWith("/admin")) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const path = parsed.data.path.split("?", 1)[0];
  const isPublicEstatePage =
    path === "/" ||
    path === "/propiedades" ||
    path.startsWith("/propiedades/") ||
    path.startsWith("/arquitectura/") ||
    [
      "/mapa",
      "/sobre-nosotros",
      "/contacto",
      "/alertas",
      "/favoritos",
    ].includes(path);
  if (!isPublicEstatePage) {
    return NextResponse.json({ error: "Página inválida" }, { status: 400 });
  }
  const propertyMatch = /^\/propiedades\/([^/]+)$/.exec(path);
  const propertyId = propertyMatch
    ? ((
        await prisma.estateProperty.findFirst({
          where: { id: propertyMatch[1], tenantId: tenant.id, published: true },
          select: { id: true },
        })
      )?.id ?? null)
    : null;
  const requestHeaders = await headers();

  await prisma.estatePageView.create({
    data: {
      tenantId: tenant.id,
      propertyId,
      path,
      visitorId: requestHeaders.get("x-visitor-id"),
      referrer: parsed.data.referrer ?? null,
      userAgent: requestHeaders.get("user-agent"),
    },
  });

  return new NextResponse(null, { status: 204 });
}
