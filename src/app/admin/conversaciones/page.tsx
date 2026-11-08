import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { toWhatsAppMessageLink } from "@/lib/social-links";
import { getStoreSettings, getWhatsappTemplates } from "@/lib/settings";
import { renderWhatsappTemplate } from "@/lib/whatsapp-templates";
import type { Prisma } from "@/generated/prisma/client";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const PAGE_SIZE = 25;

type Filter = "all" | "contact" | "handled";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "contact", label: "Para contactar" },
  { id: "handled", label: "Atendidas" },
];

function isLikelyPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export default async function AdminConversacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; page?: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const [{ storeName }, whatsappTemplates] = await Promise.all([getStoreSettings(tenant.id), getWhatsappTemplates(tenant.id)]);
  const params = await searchParams;
  const filter: Filter = (["contact", "handled"] as const).find((f) => f === params.f) ?? "all";
  const page = Math.max(1, Number(params.page) || 1);

  const filterWhere = (f: Filter): Prisma.EstateAiConversationWhereInput =>
    f === "contact" ? { phone: { not: null }, handledAt: null } : f === "handled" ? { handledAt: { not: null } } : {};
  const where: Prisma.EstateAiConversationWhereInput = { tenantId: tenant.id, ...filterWhere(filter) };

  const [rows, total, counts] = await Promise.all([
    prisma.estateAiConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        handledAt: true,
        lastMessageAt: true,
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 1, where: { role: "user" }, select: { content: true } },
      },
    }),
    prisma.estateAiConversation.count({ where }),
    Promise.all(FILTERS.map((f) => prisma.estateAiConversation.count({ where: { tenantId: tenant.id, ...filterWhere(f.id) } }))),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(over: { f?: string; page?: string }) {
    const sp = new URLSearchParams();
    const f = over.f !== undefined ? over.f : filter === "all" ? undefined : filter;
    if (f) sp.set("f", f);
    if (over.page) sp.set("page", over.page);
    const qs = sp.toString();
    return `/admin/conversaciones${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Conversaciones con el asistente IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada charla del chat queda guardada acá, con el nombre y el teléfono que dejó el visitante al
          empezar. Si la IA no resolvió su consulta, podés contactarlo por WhatsApp.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f, i) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            render={<Link href={pageHref({ f: f.id === "all" ? "" : f.id, page: "" })} />}
          >
            {f.label} <span className="opacity-70">{counts[i]}</span>
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Primera consulta</TableHead>
            <TableHead>Mensajes</TableHead>
            <TableHead>Última actividad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/conversaciones/${c.id}`} className="hover:text-primary">
                  {c.name ?? "Anónimo"}
                </Link>
              </TableCell>
              <TableCell>
                {c.phone ? (
                  isLikelyPhone(c.phone) ? (
                    <a
                      href={toWhatsAppMessageLink(c.phone, renderWhatsappTemplate(whatsappTemplates.aiConversation, { nombre: c.name ?? "", inmobiliaria: storeName }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
                      {c.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-[260px] truncate text-muted-foreground">
                {c.messages[0]?.content ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{c._count.messages}</TableCell>
              <TableCell className="text-muted-foreground">{dateFormatter.format(c.lastMessageAt)}</TableCell>
              <TableCell>
                {c.handledAt ? (
                  <Badge variant="secondary">Atendida</Badge>
                ) : c.phone ? (
                  <Badge>Para contactar</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin contacto</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/conversaciones/${c.id}`} className="text-xs font-semibold text-primary hover:underline">
                  Ver →
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {filter !== "all" ? "Ninguna conversación coincide." : "Todavía no hubo conversaciones con el asistente."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} render={<Link href={pageHref({ page: String(page - 1) })} />}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} render={<Link href={pageHref({ page: String(page + 1) })} />}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
