import Link from "next/link";
import { ArrowLeft, CheckCircle2Icon, FileTextIcon, IdCardIcon, LockIcon, ReceiptTextIcon, Tags, UsersIcon } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { estateOptions } from "@/lib/estate/data";
import { RecordForm } from "@/components/estate/record-form";
import { SectionNav } from "@/components/estate/section-nav";

const NAV_ITEMS = [
  { id: "datos", label: "Datos", icon: <IdCardIcon className="size-4" /> },
  { id: "garantes", label: "Garantes", icon: <UsersIcon className="size-4" /> },
  { id: "gastos-recurrentes", label: "Gastos recurrentes", icon: <ReceiptTextIcon className="size-4" /> },
  { id: "documentos", label: "Documentos", icon: <FileTextIcon className="size-4" /> },
  { id: "entrega", label: "Entrega", icon: <CheckCircle2Icon className="size-4" /> },
];

// Mismo título/descripción que los gestores reales (contract-guarantors-manager,
// contract-documents-manager, contract-handover-section) — acá solo se ven
// bloqueados porque todavía no existe el contractId al que colgarlos.
function PendingSection({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div id={id} className="scroll-mt-6 flex flex-col gap-2 rounded-2xl border border-dashed bg-card/50 p-5 text-muted-foreground">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <LockIcon className="size-4" />
        {title}
      </h2>
      <p className="text-sm">{description}</p>
      <p className="text-sm font-medium">Guardá el contrato para habilitar esta sección.</p>
    </div>
  );
}

export default async function NuevoContratoPage() {
  const { tenant } = await requireTenantAdmin();
  const options = await estateOptions(tenant.id);

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
            Nuevo contrato
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
        <SectionNav items={NAV_ITEMS} />
        <div className="min-w-0 space-y-6">
          <section id="datos" className="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7">
            <RecordForm module="contratos" options={options} />
          </section>

          <PendingSection
            id="garantes"
            title="Garantes"
            description="Personas que respaldan este contrato — podés agregar más de una."
          />
          <PendingSection
            id="gastos-recurrentes"
            title="Gastos recurrentes"
            description="Expensas, ABL, tasas — conceptos que suelen sumarse al alquiler cada mes."
          />
          <PendingSection
            id="documentos"
            title="Documentos"
            description="Contrato firmado, inventario, acta de entrega u otra documentación."
          />
          <PendingSection
            id="entrega"
            title="Estado del inmueble al iniciar el alquiler"
            description="Fotos de cómo estaba la propiedad, más la conformidad de cada parte."
          />
        </div>
      </div>
    </div>
  );
}
