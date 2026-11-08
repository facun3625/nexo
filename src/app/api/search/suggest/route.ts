import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { money } from "@/lib/estate/modules";
import type { SuggestGroup } from "@/components/search/suggest-input";

// Sin acentos ni mayúsculas: «cordoba» encuentra «Córdoba». Se filtra acá y
// no en la base porque Postgres no ignora acentos sin una extensión.
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const MAX_PLACES = 4;
const MAX_TYPES = 3;
const MAX_PROPERTIES = 6;

// Solo datos públicos: nunca dirección privada ni propietario.
export async function GET(request: NextRequest) {
  const query = normalize((request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100));
  const tenant = await getCurrentTenant();
  if (!tenant || query.length < 2) return NextResponse.json({ groups: [] });

  const properties = await prisma.estateProperty.findMany({
    where: { tenantId: tenant.id, published: true, listings: { some: { status: "AVAILABLE" } } },
    select: {
      id: true,
      title: true,
      code: true,
      city: true,
      neighborhood: true,
      propertyType: true,
      media: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      listings: { where: { status: "AVAILABLE" }, select: { price: true, currency: true, showPrice: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 1000,
  });

  const words = query.split(/\s+/);
  const matchesAll = (text: string) => {
    const haystack = normalize(text);
    return words.every((word) => haystack.includes(word));
  };
  const unique = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))];

  const toQueryHref = (label: string) => `/propiedades?q=${encodeURIComponent(label)}`;
  const places = unique(properties.flatMap((p) => [p.neighborhood, p.city])).filter(matchesAll).slice(0, MAX_PLACES);
  const types = unique(properties.map((p) => p.propertyType)).filter(matchesAll).slice(0, MAX_TYPES);
  const found = properties
    .filter((p) => matchesAll(`${p.title} ${p.code} ${p.city} ${p.neighborhood} ${p.propertyType}`))
    .slice(0, MAX_PROPERTIES);

  const groups: SuggestGroup[] = [
    { label: "Zonas", items: places.map((label) => ({ href: toQueryHref(label), title: label })) },
    { label: "Tipos de propiedad", items: types.map((label) => ({ href: toQueryHref(label), title: label })) },
    {
      label: "Propiedades",
      items: found.map((p) => {
        const priced = p.listings.find((l) => l.showPrice && l.price && Number(l.price) > 0);
        return {
          href: `/propiedades/${p.id}`,
          title: p.title,
          subtitle: [[p.neighborhood, p.city].filter(Boolean).join(", "), priced ? money(priced.price!, priced.currency) : ""].filter(Boolean).join(" · "),
          image: p.media[0]?.url ?? null,
        };
      }),
    },
  ].filter((group) => group.items.length > 0);

  return NextResponse.json({ groups }, { headers: { "Cache-Control": "public, max-age=30" } });
}
