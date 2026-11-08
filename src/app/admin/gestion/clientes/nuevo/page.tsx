import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { estateOptions } from "@/lib/estate/data";
import { RecordForm } from "@/components/estate/record-form";

export default async function NuevoContactoPage() {
  const { tenant } = await requireTenantAdmin();
  const options = await estateOptions(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gestion/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Clientes y contactos
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Nuevo contacto</h1>
      </div>
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <RecordForm module="clientes" options={options} />
      </section>
    </div>
  );
}
