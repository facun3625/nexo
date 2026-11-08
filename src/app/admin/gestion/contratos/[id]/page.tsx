import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2Icon, FileTextIcon, IdCardIcon, ReceiptTextIcon, Tags, UsersIcon } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { estateRows, estateOptions } from "@/lib/estate/data";
import { prisma } from "@/lib/prisma";
import { RecordForm } from "@/components/estate/record-form";
import { ContractGuarantorsManager } from "@/components/estate/contract-guarantors-manager";
import { ContractChargeConceptsManager } from "@/components/estate/contract-charge-concepts-manager";
import { ContractDocumentsManager } from "@/components/estate/contract-documents-manager";
import { ContractHandoverSection } from "@/components/estate/contract-handover-section";
import { SectionNav } from "@/components/estate/section-nav";
import { GenerateBillingButton } from "@/components/estate/generate-billing-button";
import { BillingSuggestionsPanel, type BillingSuggestion } from "@/components/estate/billing-suggestions-panel";

export default async function EditarContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { id } = await params;
  const [options, [record]] = await Promise.all([
    estateOptions(tenant.id),
    estateRows("contratos", tenant.id, "", 0, id),
  ]);
  if (!record) notFound();

  const propertyId = String(record.values.propertyId ?? "");
  const [documents, handoverPhotos, guarantorRows, chargeConcepts, property, billingSuggestions] = await Promise.all([
    prisma.estateContractDocument.findMany({
      where: { tenantId: tenant.id, contractId: record.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.estateContractHandoverPhoto.findMany({
      where: { tenantId: tenant.id, contractId: record.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.estateContractGuarantor.findMany({
      where: { tenantId: tenant.id, contractId: record.id },
      include: { contact: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.estateContractChargeConcept.findMany({
      where: { tenantId: tenant.id, contractId: record.id },
      orderBy: { createdAt: "asc" },
    }),
    propertyId
      ? prisma.estateProperty.findFirst({
          where: { id: propertyId, tenantId: tenant.id },
          include: { owner: { select: { name: true } } },
        })
      : Promise.resolve(null),
    prisma.estateBillingSuggestion.findMany({
      where: { tenantId: tenant.id, contractId: record.id },
      include: { contract: { select: { reference: true, currency: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const navItems = [
    { id: "datos", label: "Datos", icon: <IdCardIcon className="size-4" /> },
    { id: "garantes", label: "Garantes", icon: <UsersIcon className="size-4" /> },
    { id: "gastos-recurrentes", label: "Gastos recurrentes", icon: <ReceiptTextIcon className="size-4" /> },
    { id: "documentos", label: "Documentos", icon: <FileTextIcon className="size-4" /> },
    { id: "entrega", label: "Entrega", icon: <CheckCircle2Icon className="size-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/gestion/contratos"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Contratos
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {record.title}
          </h1>
        </div>
        <Link
          href="/admin/gestion/contratos/categorias"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
        >
          <Tags className="size-4" />
          Categorías
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[210px_1fr]">
        <SectionNav items={navItems} />
        <div className="min-w-0 space-y-6">
          <section id="datos" className="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7">
            <div className="mb-4">
              <p className="text-sm font-medium">Propietario</p>
              {property?.owner ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {property.owner.name}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Sin propietario asignado en la propiedad.
                </p>
              )}
              {property && (
                <Link
                  href={`/admin/gestion/propiedades/${property.id}`}
                  className="mt-1 inline-block text-sm text-primary underline"
                >
                  {property.owner ? "Cambiar en la propiedad" : "Asignar o crear uno en la propiedad"}
                </Link>
              )}
            </div>
            <RecordForm
              module="contratos"
              id={record.id}
              values={record.values}
              options={options}
            />
          </section>

          <div id="garantes" className="scroll-mt-6">
            <ContractGuarantorsManager
              contractId={record.id}
              guarantors={guarantorRows.map((g) => ({
                id: g.id,
                contactId: g.contactId,
                name: g.contact.name,
              }))}
              contactOptions={(options.contacts as { id: string; label: string }[] | undefined) ?? []}
            />
          </div>

          <div id="gastos-recurrentes" className="scroll-mt-6 space-y-4">
            <ContractChargeConceptsManager
              contractId={record.id}
              currency={String(record.values.currency ?? "ARS")}
              concepts={chargeConcepts.map((c) => ({
                id: c.id,
                name: c.name,
                active: c.active,
                amount: c.lastAmount?.toString() ?? "",
              }))}
            />
            <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5">
              <div>
                <p className="text-sm font-medium">Cobros de este mes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Arma el cobro del alquiler (si corresponde) y una sugerencia con los gastos
                  recurrentes activos de este contrato, para que cargues el monto de cada uno y
                  confirmes.
                </p>
              </div>
              <GenerateBillingButton contractId={record.id} />
            </div>
            {billingSuggestions.length > 0 && (
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
          </div>

          <div id="documentos" className="scroll-mt-6">
            <ContractDocumentsManager
              contractId={record.id}
              documents={documents.map((d) => ({
                id: d.id,
                title: d.title,
                type: d.type,
                visibility: d.visibility,
                url: d.url,
                createdAt: d.createdAt,
              }))}
            />
          </div>

          <div id="entrega" className="scroll-mt-6">
            <ContractHandoverSection
              contractId={record.id}
              photos={handoverPhotos.map((p) => ({ id: p.id, url: p.url }))}
              tenantAcceptedAt={
                record.values.tenantAcceptedHandoverAt ? String(record.values.tenantAcceptedHandoverAt) : null
              }
              ownerAcceptedAt={
                record.values.ownerAcceptedHandoverAt ? String(record.values.ownerAcceptedHandoverAt) : null
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
