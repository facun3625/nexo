import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { absoluteUrl } from "@/lib/site-url";

// Se arma en cada pedido: una propiedad recién publicada entra sola.
export const dynamic = "force-dynamic";

const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/propiedades", priority: 0.9, changeFrequency: "daily" },
  { path: "/mapa", priority: 0.6, changeFrequency: "daily" },
  { path: "/arquitectura/obras", priority: 0.7, changeFrequency: "weekly" },
  { path: "/arquitectura/servicios", priority: 0.5, changeFrequency: "monthly" },
  { path: "/arquitectura/equipo", priority: 0.4, changeFrequency: "monthly" },
  { path: "/sobre-nosotros", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contacto", priority: 0.5, changeFrequency: "monthly" },
  { path: "/alertas", priority: 0.4, changeFrequency: "monthly" },
  { path: "/preguntas-frecuentes", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terminos", priority: 0.1, changeFrequency: "monthly" },
  { path: "/privacidad", priority: 0.1, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getCurrentTenant();
  const now = new Date();
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
  if (!tenant) return pages;

  const [properties, developments] = await Promise.all([
    prisma.estateProperty.findMany({
      where: { tenantId: tenant.id, published: true, listings: { some: { status: "AVAILABLE" } } },
      select: { id: true, updatedAt: true, media: { orderBy: { position: "asc" }, take: 5, select: { url: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.estateDevelopment.findMany({
      where: { tenantId: tenant.id, published: true },
      select: { id: true, updatedAt: true, images: { orderBy: { order: "asc" }, take: 5, select: { url: true } } },
    }),
  ]);

  return [
    ...pages,
    ...properties.map((p) => ({
      url: absoluteUrl(`/propiedades/${p.id}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.media.map((m) => absoluteUrl(m.url)),
    })),
    ...developments.map((d) => ({
      url: absoluteUrl(`/arquitectura/obras/${d.id}`),
      lastModified: d.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: d.images.map((m) => absoluteUrl(m.url)),
    })),
  ];
}
