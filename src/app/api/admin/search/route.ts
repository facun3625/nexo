import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { parseAgentPermissions } from "@/lib/agent-permissions";
import { inquiryChannelFor } from "@/lib/estate/inquiry-channels";
import type { SuggestGroup } from "@/components/search/suggest-input";

const TAKE = 5;
const SCOPES = ["propiedades", "clientes", "consultas", "contratos", "obras"] as const;
type Scope = (typeof SCOPES)[number];

// Buscador del panel. Con ?scope= busca en una sola sección (la lista de
// propiedades, por ejemplo); sin scope, en todo. Un agente solo ve las
// secciones que tiene con acceso a todos los registros: las de acceso
// «propio» dependen de cada registro y no se ofrecen acá.
export async function GET(request: NextRequest) {
  const tenant = await getCurrentTenant();
  const session = await auth();
  if (!tenant || session?.user.tenantId !== tenant.id) return NextResponse.json({ groups: [] }, { status: 401 });

  let allowed: Set<Scope>;
  if (session.user.role === "ADMIN") {
    allowed = new Set(SCOPES);
  } else if (session.user.role === "AGENT") {
    const agent = await prisma.estateAgent.findFirst({
      where: { tenantId: tenant.id, userId: session.user.id, accessEnabled: true },
      select: { permissions: true },
    });
    const permissions = parseAgentPermissions(agent?.permissions);
    allowed = new Set<Scope>();
    if (permissions.properties === "ALL") allowed.add("propiedades");
    if (permissions.contacts === "ALL") allowed.add("clientes");
    if (permissions.inquiries === "ALL") allowed.add("consultas");
    if (permissions.contracts === "ALL") allowed.add("contratos");
    if (permissions.developments === "ALL") allowed.add("obras");
  } else {
    return NextResponse.json({ groups: [] }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ groups: [] });
  const scope = params.get("scope");
  const wants = (name: Scope) => allowed.has(name) && (!scope || scope === name);
  const contains = { contains: q, mode: "insensitive" as const };
  const tenantId = tenant.id;

  const [properties, contacts, inquiries, contracts, developments] = await Promise.all([
    wants("propiedades")
      ? prisma.estateProperty.findMany({
          where: { tenantId, OR: [{ title: contains }, { code: contains }, { city: contains }, { neighborhood: contains }, { address: contains }] },
          select: { id: true, title: true, code: true, city: true, published: true, media: { orderBy: { position: "asc" }, take: 1, select: { url: true } } },
          orderBy: { updatedAt: "desc" },
          take: scope ? 8 : TAKE,
        })
      : [],
    wants("clientes")
      ? prisma.estateContact.findMany({
          where: { tenantId, archived: false, OR: [{ name: contains }, { email: contains }, { phone: contains }] },
          select: { id: true, name: true, email: true, phone: true },
          orderBy: { updatedAt: "desc" },
          take: scope ? 8 : TAKE,
        })
      : [],
    wants("consultas")
      ? prisma.estateInquiry.findMany({
          where: { tenantId, OR: [{ message: contains }, { contact: { name: contains } }, { contact: { phone: contains } }] },
          select: { id: true, message: true, source: true, searchCriteria: true, propertyId: true, contact: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: scope ? 8 : TAKE,
        })
      : [],
    wants("contratos")
      ? prisma.estateContract.findMany({
          where: { tenantId, OR: [{ property: { title: contains } }, { property: { code: contains } }, { contact: { name: contains } }] },
          select: { id: true, property: { select: { title: true } }, contact: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: scope ? 8 : TAKE,
        })
      : [],
    wants("obras")
      ? prisma.estateDevelopment.findMany({
          where: { tenantId, OR: [{ name: contains }, { city: contains }] },
          select: { id: true, name: true, city: true },
          orderBy: { updatedAt: "desc" },
          take: scope ? 8 : TAKE,
        })
      : [],
  ]);

  const groups: SuggestGroup[] = [
    {
      label: "Propiedades",
      items: properties.map((p) => ({
        href: `/admin/gestion/propiedades/${p.id}`,
        title: p.title,
        subtitle: [p.code, p.city, p.published ? "" : "Borrador"].filter(Boolean).join(" · "),
        image: p.media[0]?.url ?? null,
      })),
    },
    {
      label: "Clientes",
      items: contacts.map((c) => ({
        href: `/admin/gestion/clientes/${c.id}`,
        title: c.name,
        subtitle: [c.phone, c.email].filter(Boolean).join(" · "),
      })),
    },
    {
      label: "Consultas",
      items: inquiries.map((i) => ({
        href: `/admin/gestion/consultas?channel=${inquiryChannelFor(i)}&edit=${i.id}`,
        title: i.contact.name,
        subtitle: i.message,
      })),
    },
    {
      label: "Contratos",
      items: contracts.map((c) => ({
        href: `/admin/gestion/contratos/${c.id}`,
        title: c.property.title,
        subtitle: c.contact.name,
      })),
    },
    {
      label: "Obras",
      items: developments.map((d) => ({
        href: `/admin/gestion/emprendimientos/${d.id}`,
        title: d.name,
        subtitle: d.city,
      })),
    },
  ].filter((group) => group.items.length > 0);

  return NextResponse.json({ groups });
}
