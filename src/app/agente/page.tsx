import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/require-agent";
import { inquiryChannelFor, inquiryChannels, inquiryChannelWhere, parseInquiryChannel } from "@/lib/estate/inquiry-channels";
import { labels } from "@/lib/estate/modules";
import { AssignedInquiryEditor } from "@/components/estate/assigned-inquiry-editor";
import { InquiryMatches } from "@/components/estate/inquiry-matches";
import { AccountMenu } from "@/components/account-menu";
import { inquiryScopeWhere } from "@/lib/agent-permissions";
import { AGENT_MENU_SECTIONS } from "@/lib/agent-permission-types";

function permissionForChannel(channel: keyof typeof inquiryChannels) {
  return channel === "searches" ? "searches" : "inquiries";
}

export default async function AgentPage({ searchParams }: { searchParams: Promise<{ channel?: string; id?: string; page?: string }> }) {
  const { agent, tenant, permissions } = await requireAgent();
  const search = await searchParams;
  const requestedChannel = parseInquiryChannel(search.channel);
  const firstAdminSection = AGENT_MENU_SECTIONS.find((section) => permissions[section.key] !== "NONE");
  const availableChannels = Object.keys(inquiryChannels).filter(
    (key) => permissions[permissionForChannel(key as keyof typeof inquiryChannels)] !== "NONE",
  ) as (keyof typeof inquiryChannels)[];
  const channel = availableChannels.includes(requestedChannel)
    ? requestedChannel
    : availableChannels[0];
  if (!channel) {
    return <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-16 text-center"><AccountMenu /><h1 className="text-2xl font-semibold">Sin secciones habilitadas</h1><p className="text-sm text-muted-foreground">Pedile al administrador que te habilite al menos una bandeja de consultas.</p></main>;
  }
  const page = Math.max(1, Math.min(10000, Math.floor(Number(search.page)) || 1));
  const accessScope = inquiryScopeWhere(permissions[permissionForChannel(channel)], agent.id);
  if (!accessScope) notFound();
  const scope = { tenantId: tenant.id, ...accessScope };
  const [inquiries, selected] = await Promise.all([
    prisma.estateInquiry.findMany({ where: { ...scope, ...inquiryChannelWhere(channel) }, include: { contact: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 30, take: 31 }),
    search.id ? prisma.estateInquiry.findFirst({ where: { ...scope, id: search.id }, include: { contact: { select: { name: true, email: true, phone: true } }, property: { select: { title: true } } } }) : null,
  ]);
  if (search.id && (!selected || inquiryChannelFor(selected) !== channel)) notFound();
  return <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
    <header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Consultas</h1><p className="mt-1 text-sm text-muted-foreground">{agent.name} · {permissions[permissionForChannel(channel)] === "ALL" ? "Todas las consultas habilitadas" : "Solo consultas asignadas a tu usuario"}</p></div><div className="flex items-center gap-3">{firstAdminSection && <Link href={firstAdminSection.key === "inquiries" ? "/agente?channel=property" : firstAdminSection.key === "searches" ? "/agente?channel=searches" : firstAdminSection.href} className="rounded-lg border px-3 py-2 text-sm font-medium">Abrir panel</Link>}<AccountMenu /></div></header>
    <nav className="flex flex-wrap gap-2" aria-label="Tipos de consulta">{availableChannels.map((key) => <Link key={key} href={`/agente?channel=${key}`} className={`rounded-xl border px-3 py-2 text-sm ${key === channel ? "bg-primary text-primary-foreground" : ""}`}>{inquiryChannels[key]}</Link>)}</nav>
    {selected && <section className="space-y-4 rounded-2xl border p-5"><div className="flex justify-between"><h2 className="font-semibold">{selected.contact.name}</h2><Link href={`/agente?channel=${channel}`} className="text-sm underline">Cerrar</Link></div><p className="text-sm">{selected.property?.title}</p><div className="flex flex-wrap gap-4 text-sm">{selected.contact.email && <a href={`mailto:${selected.contact.email}`} className="underline">{selected.contact.email}</a>}{selected.contact.phone && <a href={`tel:${selected.contact.phone}`} className="underline">{selected.contact.phone}</a>}</div><p className="whitespace-pre-wrap text-sm">{selected.message}</p><InquiryMatches tenantId={tenant.id} inquiryId={selected.id} agentView /><AssignedInquiryEditor key={`${selected.id}:${selected.updatedAt.toISOString()}`} id={selected.id} status={selected.status} notes={selected.notes} /></section>}
    <div className="divide-y rounded-2xl border">{inquiries.slice(0, 30).map((inquiry) => <Link key={inquiry.id} href={`/agente?channel=${channel}&id=${inquiry.id}`} className="block space-y-1 p-4 hover:bg-muted/40"><div className="flex justify-between gap-3"><span className="font-medium">{inquiry.contact.name}</span><span className="text-xs">{labels[inquiry.status]}</span></div><p className="line-clamp-2 text-sm text-muted-foreground">{inquiry.message}</p></Link>)}{!inquiries.length && <p className="p-6 text-sm text-muted-foreground">No tenés consultas asignadas en esta categoría.</p>}</div>
    <nav className="flex justify-between text-sm">{page > 1 ? <Link href={`?channel=${channel}&page=${page - 1}`}>Anterior</Link> : <span />}{inquiries.length > 30 && <Link href={`?channel=${channel}&page=${page + 1}`}>Siguiente</Link>}</nav>
  </main>;
}
