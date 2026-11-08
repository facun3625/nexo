import Link from "next/link";
import { SuggestInput } from "@/components/search/suggest-input";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Plus,
  Search,
  Building2,
  ChevronRight,
  BedDouble,
  Bath,
  Tags,
  ChevronDown,
} from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import {
  modules,
  money,
  dateLabel,
  labels,
  chargeStatus,
  consultaStatusBadgeClass,
} from "@/lib/estate/modules";
import {
  estateRows,
  estateOptions,
  estatePropertyFilterOptions,
  type EstateFilters,
} from "@/lib/estate/data";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { RecordForm } from "@/components/estate/record-form";
import { MarkSeenOnMount } from "@/components/admin/mark-seen-on-mount";
import { InquiryStatusPanel } from "@/components/estate/inquiry-status-panel";
import { markEstateInquirySeen } from "@/app/admin/gestion/actions";
import { BillingSuggestionsPanel, type BillingSuggestion } from "@/components/estate/billing-suggestions-panel";
import { PaymentForm, CancelCharge } from "@/components/estate/payment-form";
import { FeatureToggleButton } from "@/components/estate/feature-toggle-button";
import { FeaturedPropertiesOrder } from "@/components/estate/featured-properties-order";
import { inquiryChannels, inquiryChannelWhere, parseInquiryChannel } from "@/lib/estate/inquiry-channels";
import { AgentAccessForm } from "@/components/estate/agent-access-form";
import { InquiryMatches } from "@/components/estate/inquiry-matches";
import { ClickableRow } from "@/components/estate/clickable-row";

const MIN_OPTIONS = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}+` }));

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={value ?? ""}
        aria-label={label}
        className="appearance-none rounded-xl border bg-card py-2 pl-3 pr-8 text-sm text-foreground"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

const inquiryDate = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

// Secciones con buscador predictivo (ver /api/admin/search).
const SUGGEST_SCOPES = ["propiedades", "clientes", "consultas", "contratos"];

export default async function EstateModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    edit?: string;
    new?: string;
    operation?: string;
    propertyType?: string;
    city?: string;
    neighborhood?: string;
    bedroomsMin?: string;
    bathroomsMin?: string;
    garagesMin?: string;
    role?: string;
    channel?: string;
    assignedAgentId?: string;
  }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { module } = await params;
  const search = await searchParams;
  if (!Object.hasOwn(modules, module)) notFound();
  const config = modules[module];
  const q = (typeof search.q === "string" ? search.q : "").slice(0, 200);
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(search.page)) || 1),
  );
  const base = `/admin/gestion/${module}`;
  const isPropiedades = module === "propiedades";
  const isClientes = module === "clientes";
  const roleOptions = modules.clientes.fields.find((f) => f.name === "roles")?.options ?? [];
  const filters: EstateFilters = isPropiedades
    ? {
        operation: search.operation || undefined,
        propertyType: search.propertyType || undefined,
        city: search.city || undefined,
        neighborhood: search.neighborhood || undefined,
        bedroomsMin: search.bedroomsMin ? Number(search.bedroomsMin) : undefined,
        bathroomsMin: search.bathroomsMin ? Number(search.bathroomsMin) : undefined,
        garagesMin: search.garagesMin ? Number(search.garagesMin) : undefined,
      }
    : isClientes
      ? { role: search.role && roleOptions.includes(search.role) ? search.role : undefined }
      : module === "consultas" ? { channel: parseInquiryChannel(search.channel), assignedAgentId: search.assignedAgentId || undefined } : {};
  const [options, propertyFilterOptions, featuredProperties] = await Promise.all([
    estateOptions(tenant.id),
    isPropiedades ? estatePropertyFilterOptions(tenant.id) : Promise.resolve(null),
    isPropiedades
      ? prisma.estateProperty.findMany({
          where: { tenantId: tenant.id, featured: true },
          orderBy: { featuredOrder: "asc" },
          select: { id: true, title: true, code: true },
        })
      : Promise.resolve([]),
  ]);
  const inquiryCounts = module === "consultas" ? Object.fromEntries(await Promise.all(
    Object.keys(inquiryChannels).map(async (channel) => [channel, await prisma.estateInquiry.count({ where: { tenantId: tenant.id, ...inquiryChannelWhere(parseInquiryChannel(channel)) } })]),
  )) : {};
  const records = await estateRows(
    module,
    tenant.id,
    q,
    (page - 1) * 50,
    undefined,
    filters,
  );
  const edit =
    typeof search.edit === "string"
      ? (await estateRows(module, tenant.id, "", 0, search.edit))[0]
      : undefined;
  if (search.edit && !edit) notFound();
  const inquiryHistory =
    module === "consultas" && edit
      ? await prisma.estateInquiry.findFirst({
          where: { id: edit.id, tenantId: tenant.id },
          select: {
            createdAt: true,
            propertyId: true,
            contact: { select: { id: true, email: true } },
            statusChanges: {
              orderBy: { createdAt: "asc" },
              select: { id: true, status: true, changedByName: true, createdAt: true },
            },
          },
        })
      : null;
  const isContratos = module === "contratos";
  const billingSuggestions = isContratos
    ? await prisma.estateBillingSuggestion.findMany({
        where: { tenantId: tenant.id },
        include: { contract: { select: { reference: true, currency: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const charges =
    module === "cobranzas"
      ? await prisma.estateCharge.findMany({
          where: {
            tenantId: tenant.id,
            contractId: { not: null },
            ...(q ? { concept: { contains: q, mode: "insensitive" } } : {}),
          },
          include: {
            contract: { include: { contact: true } },
            receipts: { orderBy: { createdAt: "desc" } },
          },
          orderBy: { dueAt: "desc" },
          take: 51,
          skip: (page - 1) * 50,
        })
      : [];
  const hasNext =
    (module === "cobranzas" ? charges.length : records.length) > 50;
  const query = new URLSearchParams({
    q,
    page: String(page),
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]),
    ),
  });
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Gestión inmobiliaria
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {config.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPropiedades && (
            <Link
              href="/admin/gestion/categorias"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            >
              <Tags className="size-4" />
              Categorías
            </Link>
          )}
          {module === "contratos" && (
            <Link
              href="/admin/gestion/contratos/categorias"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            >
              <Tags className="size-4" />
              Categorías
            </Link>
          )}
          <Link
            href={
              isPropiedades
                ? "/admin/gestion/propiedades/nueva"
                : isContratos
                  ? "/admin/gestion/contratos/nueva"
                  : isClientes
                    ? "/admin/gestion/clientes/nuevo"
                    : `${base}?new=1`
            }
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" />
            Nuevo {config.singular}
          </Link>
        </div>
      </header>
      {isContratos && billingSuggestions.length > 0 && (
        <BillingSuggestionsPanel
          suggestions={billingSuggestions.map((s) => ({
            id: s.id,
            kind: s.kind as BillingSuggestion["kind"],
            contractReference: s.contract.reference,
            period: s.period,
            currency: s.contract.currency,
            payload: s.payload as BillingSuggestion["payload"],
          }))}
        />
      )}
      {!isPropiedades && !isContratos && !isClientes && (search.new || edit) && (
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          {module === "consultas" && edit && (
            <MarkSeenOnMount
              when={edit.values.status === "NEW"}
              action={markEstateInquirySeen.bind(null, edit.id)}
            />
          )}
          <div className="mb-6 flex justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {edit ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}
            </h2>
            <Link
              href={base}
              className="text-sm text-muted-foreground underline"
            >
              Cerrar
            </Link>
          </div>
          {module === "agentes" && edit && <AgentAccessForm agentId={edit.id} />}
          {module === "consultas" && edit && inquiryHistory && (
            <InquiryStatusPanel
              id={edit.id}
              status={String(edit.values.status)}
              createdAt={inquiryDate.format(inquiryHistory.createdAt)}
              history={inquiryHistory.statusChanges.map(({ createdAt, ...c }) => ({ ...c, when: inquiryDate.format(createdAt) }))}
              closeHref={`${base}?${query}`}
              mailHref={
                inquiryHistory.contact.email
                  ? `/admin/email-marketing/nuevo?contacto=${inquiryHistory.contact.id}${inquiryHistory.propertyId ? `&propiedad=${inquiryHistory.propertyId}` : ""}`
                  : null
              }
            />
          )}
          {module === "consultas" && edit && <InquiryMatches tenantId={tenant.id} inquiryId={edit.id} />}
          <RecordForm
            // En Consultas el estado también se cambia con los botones de
            // arriba: la key incluye el estado para que el select del
            // formulario no quede mostrando el anterior.
            key={edit ? `${edit.id}-${module === "consultas" ? edit.values.status : ""}` : "new"}
            module={module}
            id={edit?.id}
            values={edit?.values}
            options={options}
          />
        </section>
      )}
      {module === "consultas" && <nav aria-label="Tipos de consulta" className="flex flex-wrap gap-2">{Object.entries(inquiryChannels).map(([channel, label]) => <Link key={channel} href={`${base}?channel=${channel}`} aria-current={filters.channel === channel ? "page" : undefined} className={`rounded-xl border px-4 py-2 text-sm ${filters.channel === channel ? "bg-primary text-primary-foreground" : "bg-card"}`}>{label} ({inquiryCounts[channel] ?? 0})</Link>)}</nav>}
      <form className="flex flex-col gap-3">
        {module === "consultas" && <><input type="hidden" name="channel" value={filters.channel} /><FilterSelect name="assignedAgentId" label="Todos los responsables" value={filters.assignedAgentId} options={[{ value: "unassigned", label: "Sin asignar" }, ...options.inquiryAgents.map((agent) => ({ value: agent.id, label: agent.label }))]} /></>}
        <div className="flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 z-10 size-4 text-muted-foreground" />
            {SUGGEST_SCOPES.includes(module) ? (
              <SuggestInput
                endpoint={`/api/admin/search?scope=${module}`}
                ariaLabel="Buscar registros"
                name="q"
                defaultValue={q}
                placeholder="Buscar…"
                className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-7 text-sm"
              />
            ) : (
              <input
                aria-label="Buscar registros"
                name="q"
                defaultValue={q}
                placeholder="Buscar…"
                className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-3 text-sm"
              />
            )}
          </div>
          <button className="rounded-xl border px-4 text-sm">Buscar</button>
        </div>
        {isPropiedades && propertyFilterOptions && (
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              name="operation"
              label="Operación"
              value={filters.operation}
              options={[
                { value: "SALE", label: "Venta" },
                { value: "RENT", label: "Alquiler" },
              ]}
            />
            <FilterSelect
              name="propertyType"
              label="Tipo de inmueble"
              value={filters.propertyType}
              options={(
                modules.propiedades.fields.find((f) => f.name === "propertyType")?.options ?? []
              ).map((o) => ({ value: o, label: o }))}
            />
            <FilterSelect
              name="city"
              label="Ciudad"
              value={filters.city}
              options={propertyFilterOptions.cities.map((c) => ({ value: c, label: c }))}
            />
            <FilterSelect
              name="neighborhood"
              label="Barrio"
              value={filters.neighborhood}
              options={propertyFilterOptions.neighborhoods.map((n) => ({ value: n, label: n }))}
            />
            <FilterSelect
              name="bedroomsMin"
              label="Dormitorios"
              value={filters.bedroomsMin ? String(filters.bedroomsMin) : undefined}
              options={MIN_OPTIONS}
            />
            <FilterSelect
              name="bathroomsMin"
              label="Baños"
              value={filters.bathroomsMin ? String(filters.bathroomsMin) : undefined}
              options={MIN_OPTIONS}
            />
            <FilterSelect
              name="garagesMin"
              label="Cocheras"
              value={filters.garagesMin ? String(filters.garagesMin) : undefined}
              options={MIN_OPTIONS}
            />
            <button className="rounded-xl border px-3 text-xs text-muted-foreground hover:text-foreground">
              Filtrar
            </button>
            {(filters.operation ||
              filters.propertyType ||
              filters.city ||
              filters.neighborhood ||
              filters.bedroomsMin ||
              filters.bathroomsMin ||
              filters.garagesMin) && (
              <Link
                href={`${base}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                className="self-center text-xs text-muted-foreground underline"
              >
                Limpiar filtros
              </Link>
            )}
          </div>
        )}
        {isClientes && (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", role: undefined, label: "Todos" },
              ...roleOptions.map((role) => ({ key: role, role, label: labels[role] ?? role })),
            ].map(({ key, role, label }) => {
              const active = filters.role === role;
              const params = new URLSearchParams({ ...(q ? { q } : {}), ...(role && !active ? { role } : {}) });
              return (
                <Link
                  key={key}
                  href={`${base}${params.size ? `?${params}` : ""}`}
                  className={
                    active
                      ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      : "rounded-full border-2 border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-muted"
                  }
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </form>
      {isPropiedades && <FeaturedPropertiesOrder properties={featuredProperties} />}
      {module === "cobranzas" ? (
        <div className="space-y-4">
          {charges.slice(0, 50).map((charge) => {
            const paid = charge.receipts.reduce(
              (n, r) => n.plus(r.amount),
              new Prisma.Decimal(0),
            );
            const balance = charge.amount.minus(paid);
            const status = chargeStatus(charge, balance, paid);
            return (
              <article
                key={charge.id}
                className="rounded-2xl border bg-card p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      {charge.concept} · {charge.period}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {charge.contract
                        ? `${charge.contract.reference} · ${charge.contract.contact.name}`
                        : "Contrato no disponible"}{" "}
                      · Vence {dateLabel(charge.dueAt)}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {status}
                  </span>
                </div>
                <div className="my-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="text-muted-foreground">
                    Importe
                    <p className="mt-1 font-semibold text-foreground">
                      {money(charge.amount, charge.currency)}
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    Cobrado
                    <p className="mt-1 font-semibold text-foreground">
                      {money(paid, charge.currency)}
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    Saldo
                    <p className="mt-1 font-semibold text-foreground">
                      {money(charge.cancelled ? 0 : balance, charge.currency)}
                    </p>
                  </div>
                </div>
                {!charge.cancelled && balance.greaterThan(0) && (
                  <details className="border-t pt-3">
                    <summary className="cursor-pointer text-sm font-medium text-primary">
                      Registrar cobro recibido
                    </summary>
                    <div className="pt-4">
                      <PaymentForm
                        chargeId={charge.id}
                        balance={balance.toString()}
                        currency={charge.currency}
                      />
                    </div>
                  </details>
                )}
                {charge.receipts.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Historial de cobros ({charge.receipts.length})
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm">
                      {charge.receipts.map((r) => (
                        <li key={r.id}>
                          {dateLabel(r.paidAt)} ·{" "}
                          {money(r.amount, charge.currency)} ·{" "}
                          {labels[r.method]} · {r.reference}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {!charge.cancelled && !charge.receipts.length && (
                  <div className="mt-3">
                    <CancelCharge id={charge.id} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="divide-y">
            {records.slice(0, 50).map((row) => {
              const editHref = isPropiedades
                ? `/admin/gestion/propiedades/${row.id}`
                : isContratos
                  ? `/admin/gestion/contratos/${row.id}`
                  : isClientes
                    ? `/admin/gestion/clientes/${row.id}`
                    : `${base}?${query}&edit=${row.id}`;
              return (
              <ClickableRow
                key={row.id}
                href={editHref}
                className="flex flex-wrap items-center gap-3 p-3.5 cursor-pointer transition-colors hover:bg-muted/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold leading-tight">{row.title}</h2>
                  {isPropiedades ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {row.subtitle}
                      {row.detail ? ` · ${row.detail}` : ""}
                    </p>
                  ) : (
                    <>
                      <p className="truncate text-sm text-muted-foreground">
                        {row.subtitle}
                      </p>
                      <p className="line-clamp-1 text-sm">{row.detail}</p>
                    </>
                  )}
                </div>
                {module === "propiedades" && (
                  <div className="flex shrink-0 items-center gap-4 self-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="size-4" />
                      {row.values.bedrooms || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="size-4" />
                      {row.values.bathrooms || 0}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      module === "consultas"
                        ? consultaStatusBadgeClass(String(row.values.status))
                        : "bg-muted"
                    }`}
                  >
                    {row.status}
                    {row.statusBy && (
                      <span className="opacity-75"> · {row.statusBy}</span>
                    )}
                  </span>
                  {module === "propiedades" && (
                    <FeatureToggleButton id={row.id} featured={row.values.featured === true} />
                  )}
                  {module === "propiedades" &&
                    row.values.published === true && (
                      <Link
                        href={`/propiedades/${row.id}`}
                        target="_blank"
                        aria-label="Ver publicación"
                        className="rounded-lg border p-2"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    )}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </ClickableRow>
              );
            })}
          </div>
        </div>
      )}
      {(module === "cobranzas" ? charges : records).length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Building2 className="mx-auto mb-4 size-8 text-muted-foreground" />
          <h2 className="font-semibold">
            {q ? "No encontramos coincidencias" : "Tu espacio está listo"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {q
              ? "Probá con otra búsqueda."
              : `Creá tu primer ${config.singular} para empezar.`}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        {page > 1 ? (
          <Link
            href={`${base}?${new URLSearchParams({ q, page: String(page - 1) })}`}
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        <span className="text-muted-foreground">Página {page}</span>
        {hasNext ? (
          <Link
            href={`${base}?${new URLSearchParams({ q, page: String(page + 1) })}`}
          >
            Siguiente →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
