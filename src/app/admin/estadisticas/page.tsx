import Link from "next/link";
import {
  Building2,
  CalendarCheck2,
  Eye,
  Heart,
  MessageSquareText,
  MousePointerClick,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireTenantAdminWithPlan } from "@/lib/require-admin";
import { DEVICE_LABELS, parseDevice } from "@/lib/user-agent";
import { parseTrafficSource } from "@/lib/traffic-source";

const PERIODS = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
] as const;
const PAGE_LABELS: Record<string, string> = {
  "/": "Inicio",
  "/propiedades": "Propiedades",
  "/mapa": "Propiedades en mapa",
  "/sobre-nosotros": "Nosotros",
  "/contacto": "Contacto",
  "/alertas": "Recibir alertas",
  "/favoritos": "Favoritos",
  "/emprendimientos": "Obras (URL anterior)",
  "/arquitectura/equipo": "Arquitectura · Equipo",
  "/arquitectura/servicios": "Arquitectura · Servicios",
  "/arquitectura/obras": "Arquitectura · Obras",
};

function tally(values: string[]) {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return [...result.entries()].sort((a, b) => b[1] - a[1]);
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
function pageLabel(path: string) {
  return path.startsWith("/propiedades/")
    ? "Detalle de propiedad"
    : path.startsWith("/emprendimientos/") || path.startsWith("/arquitectura/obras/")
      ? "Detalle de obra"
      : (PAGE_LABELS[path] ?? path);
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Eye;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function Ranking({
  title,
  rows,
  total,
}: {
  title: string;
  rows: [string, number][];
  total: number;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.length ? (
          rows.slice(0, 6).map(([label, value]) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                <span className="truncate">{label}</span>
                <span className="shrink-0 font-medium">
                  {value}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({percent(value, total)}%)
                  </span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.max(3, percent(value, rows[0]?.[1] ?? 1))}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay datos para este período.
          </p>
        )}
      </div>
    </section>
  );
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { tenant } = await requireTenantAdminWithPlan();
  const requestedPeriod = (await searchParams).periodo;
  const days =
    requestedPeriod === "7" || requestedPeriod === "90"
      ? Number(requestedPeriod)
      : 30;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days + 1);

  const now = new Date();
  const [views, inquiries, favorites, scheduledVisits] = await Promise.all([
    prisma.estatePageView.findMany({
      where: { tenantId: tenant.id, createdAt: { gte: from } },
      select: {
        path: true,
        visitorId: true,
        referrer: true,
        userAgent: true,
        createdAt: true,
        property: { select: { id: true, title: true, code: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.estateInquiry.count({
      where: { tenantId: tenant.id, source: "WEB", createdAt: { gte: from } },
    }),
    prisma.estatePropertyFavorite.count({
      where: { tenantId: tenant.id, createdAt: { gte: from } },
    }),
    prisma.estateVisit.count({
      where: {
        tenantId: tenant.id,
        startsAt: { gte: from, lte: now },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  const uniqueVisitors = new Set(
    views.map((view) => view.visitorId).filter(Boolean),
  ).size;
  const propertyViews = views.filter((view) => view.property);
  const topProperties = new Map<
    string,
    { title: string; code: string; views: number; visitors: Set<string> }
  >();
  for (const view of propertyViews) {
    if (!view.property) continue;
    const item = topProperties.get(view.property.id) ?? {
      title: view.property.title,
      code: view.property.code,
      views: 0,
      visitors: new Set<string>(),
    };
    item.views += 1;
    if (view.visitorId) item.visitors.add(view.visitorId);
    topProperties.set(view.property.id, item);
  }
  const rankedProperties = [...topProperties.entries()]
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 8);
  const pageRows = tally(views.map((view) => pageLabel(view.path)));
  const deviceRows = tally(
    views.map((view) => DEVICE_LABELS[parseDevice(view.userAgent)]),
  );
  const firstViewByVisitor = new Map<string, (typeof views)[number]>();
  for (const view of views) {
    const key =
      view.visitorId ?? `anon-${view.createdAt.toISOString()}-${view.path}`;
    if (!firstViewByVisitor.has(key)) firstViewByVisitor.set(key, view);
  }
  const sourceRows = tally(
    [...firstViewByVisitor.values()].map((view) =>
      parseTrafficSource(view.referrer),
    ),
  );
  const daily = new Map<string, { views: number; visitors: Set<string> }>();
  for (let index = 0; index < days; index += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    daily.set(date.toISOString().slice(0, 10), {
      views: 0,
      visitors: new Set(),
    });
  }
  for (const view of views) {
    const point = daily.get(view.createdAt.toISOString().slice(0, 10));
    if (point) {
      point.views += 1;
      if (view.visitorId) point.visitors.add(view.visitorId);
    }
  }
  const dailyRows = [...daily.entries()];
  const maxDailyViews = Math.max(1, ...dailyRows.map(([, item]) => item.views));
  const conversion = percent(inquiries, uniqueVisitors);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Rendimiento de tu página
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Estadísticas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conocé qué buscan tus visitantes y qué propiedades generan más
            interés.
          </p>
        </div>
        <nav
          className="flex rounded-xl border bg-card p-1"
          aria-label="Período"
        >
          {PERIODS.map((period) => (
            <Link
              key={period.value}
              href={`/admin/estadisticas?periodo=${period.value}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${days === Number(period.value) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {period.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visitas totales"
          value={views.length}
          detail={`Páginas vistas en los últimos ${days} días`}
          icon={Eye}
        />
        <MetricCard
          label="Visitantes únicos"
          value={uniqueVisitors}
          detail={`${views.length && uniqueVisitors ? (views.length / uniqueVisitors).toFixed(1) : "0"} páginas por visitante`}
          icon={Users}
        />
        <MetricCard
          label="Consultas desde la web"
          value={inquiries}
          detail={`${conversion}% de los visitantes realizó una consulta`}
          icon={MessageSquareText}
        />
        <MetricCard
          label="Propiedades guardadas"
          value={favorites}
          detail="Nuevos favoritos agregados por clientes"
          icon={Heart}
        />
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Actividad diaria</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Visitas a todas las páginas del sitio
            </p>
          </div>
          <MousePointerClick className="size-5 text-primary" />
        </div>
        <div
          className="mt-6 flex h-44 items-end gap-1"
          aria-label="Gráfico de visitas diarias"
        >
          {dailyRows.map(([date, item], index) => (
            <div
              key={date}
              className="group relative flex h-full min-w-0 flex-1 items-end"
            >
              <div
                className="w-full rounded-t-sm bg-primary/75 transition-colors hover:bg-primary"
                style={{
                  height: `${Math.max(item.views ? 5 : 1, percent(item.views, maxDailyViews))}%`,
                }}
                title={`${new Date(`${date}T12:00:00`).toLocaleDateString("es-AR")}: ${item.views} visitas, ${item.visitors.size} únicos`}
              />
              {(index === 0 || index === dailyRows.length - 1) && (
                <span
                  className={`absolute -bottom-5 text-[10px] text-muted-foreground ${index ? "right-0" : "left-0"}`}
                >
                  {new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <h2 className="font-semibold">Propiedades más vistas</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Interés generado por cada publicación durante el período.
          </p>
        </div>
        {rankedProperties.length ? (
          <div className="divide-y">
            {rankedProperties.map(([id, property], index) => (
              <div
                key={id}
                className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 px-5 py-4 text-sm"
              >
                <span className="font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/admin/gestion/propiedades/${id}`}
                    className="block truncate font-medium hover:text-primary"
                  >
                    {property.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {property.code}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{property.views}</p>
                  <p className="text-xs text-muted-foreground">vistas</p>
                </div>
                <div className="w-20 text-right">
                  <p className="font-semibold">{property.visitors.size}</p>
                  <p className="text-xs text-muted-foreground">personas</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Las propiedades aparecerán acá cuando comiencen a recibir visitas.
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Ranking
          title="Páginas más vistas"
          rows={pageRows}
          total={views.length}
        />
        <Ranking
          title="Origen de los visitantes"
          rows={sourceRows}
          total={firstViewByVisitor.size}
        />
        <Ranking title="Dispositivos" rows={deviceRows} total={views.length} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <CalendarCheck2 className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{scheduledVisits}</p>
            <p className="text-xs text-muted-foreground">
              Visitas inmobiliarias realizadas o agendadas en el período
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <Building2 className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{propertyViews.length}</p>
            <p className="text-xs text-muted-foreground">
              Vistas de fichas de propiedades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <MousePointerClick className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{conversion}%</p>
            <p className="text-xs text-muted-foreground">
              Conversión web a consulta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
