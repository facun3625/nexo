import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 50;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

// Secciones del registro: la clave es EstateAuditEvent.entity.
const ENTITY_LABELS: Record<string, string> = {
  propiedades: "Propiedades",
  clientes: "Clientes",
  agentes: "Agentes",
  consultas: "Consultas",
  operaciones: "Operaciones",
  tasaciones: "Tasaciones",
  contratos: "Contratos",
  cobranzas: "Cobranzas",
  visitas: "Visitas",
  emprendimientos: "Obras",
  conversaciones: "Asistente IA",
  pagina: "Página web",
  configuracion: "Configuración",
  usuarios: "Usuarios",
  email: "Email marketing",
  // Registros viejos, anteriores a unificar los nombres.
  charge: "Cobranzas",
  receipt: "Cobranzas",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creó",
  UPDATE: "Editó",
  DELETE: "Eliminó",
  CANCEL: "Anuló",
  CONFIRM_MANUAL_PAYMENT: "Registró un cobro",
};

function entityHref(entity: string, entityId: string) {
  if (!entityId) return null;
  switch (entity) {
    case "propiedades":
      return `/admin/gestion/propiedades/${entityId}`;
    case "emprendimientos":
      return `/admin/gestion/emprendimientos/${entityId}`;
    case "clientes":
      return `/admin/gestion/clientes/${entityId}`;
    case "email":
      return `/admin/email-marketing/${entityId}`;
    default:
      return null;
  }
}

export default async function ActividadPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; u?: string; page?: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const section = params.s && ENTITY_LABELS[params.s] ? params.s : "";
  const userId = params.u ?? "";

  const where: Prisma.EstateAuditEventWhereInput = {
    tenantId: tenant.id,
    ...(section ? { entity: section === "cobranzas" ? { in: ["cobranzas", "charge", "receipt"] } : section } : {}),
    ...(userId ? { actorId: userId } : {}),
  };

  const [events, total, actors] = await Promise.all([
    prisma.estateAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.estateAuditEvent.count({ where }),
    prisma.estateAuditEvent.findMany({
      where: { tenantId: tenant.id, actorId: { not: "" } },
      distinct: ["actorId"],
      select: { actorId: true },
    }),
  ]);

  // Los registros anteriores a guardar el nombre solo tienen el id.
  const users = await prisma.user.findMany({
    where: { id: { in: actors.map((a) => a.actorId) } },
    select: { id: true, name: true, email: true },
  });
  const userName = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.name || u?.email || "Usuario eliminado";
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: { s?: string; u?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = over.s ?? section;
    const u = over.u ?? userId;
    if (s) sp.set("s", s);
    if (u) sp.set("u", u);
    if (over.page && over.page > 1) sp.set("page", String(over.page));
    const qs = sp.toString();
    return `/admin/actividad${qs ? `?${qs}` : ""}`;
  };

  const sectionOptions = Object.entries(ENTITY_LABELS).filter(([key]) => key !== "charge" && key !== "receipt");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Registro de actividad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quién hizo cada cambio en el panel y cuándo: propiedades, consultas, obras, página web, configuración, envíos
          de mails y más.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-2" action="/admin/actividad">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Sección
          <select name="s" defaultValue={section} className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground">
            <option value="">Todas</option>
            {sectionOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Usuario
          <select name="u" defaultValue={userId} className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground">
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm" variant="outline" className="h-9">
          Filtrar
        </Button>
        {(section || userId) && (
          <Button size="sm" variant="ghost" className="h-9" render={<Link href="/admin/actividad" />}>
            Limpiar
          </Button>
        )}
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Fecha</TableHead>
            <TableHead className="w-44">Usuario</TableHead>
            <TableHead className="w-32">Sección</TableHead>
            <TableHead>Qué hizo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => {
            const link = entityHref(e.entity, e.entityId);
            const text = e.summary || `${ACTION_LABELS[e.action] ?? e.action} un registro`;
            return (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{dateFormatter.format(e.createdAt)}</TableCell>
                <TableCell className="font-medium">{e.actorName || (e.actorId ? userName(e.actorId) : "Sistema")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ENTITY_LABELS[e.entity] ?? e.entity}</Badge>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {link ? (
                    <Link href={link} className="hover:text-primary hover:underline">
                      {text}
                    </Link>
                  ) : (
                    text
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {events.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                Todavía no hay actividad registrada{section || userId ? " con estos filtros" : ""}.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {total} registros
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button size="sm" variant="outline" render={<Link href={href({ page: page - 1 })} />}>
                Anterior
              </Button>
            )}
            {page < totalPages && (
              <Button size="sm" variant="outline" render={<Link href={href({ page: page + 1 })} />}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
