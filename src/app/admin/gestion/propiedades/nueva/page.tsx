import Link from "next/link";
import { ArrowLeft, BadgeDollarSignIcon, ImageIcon, MapPinIcon, Tags, TextIcon, SearchIcon } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { estateOptions } from "@/lib/estate/data";
import { RecordForm } from "@/components/estate/record-form";
import { SectionNav } from "@/components/estate/section-nav";

const NAV_ITEMS = [
  { id: "section-publicacion", label: "Publicación", icon: <TextIcon className="size-4" /> },
  { id: "section-precio", label: "Precio y características", icon: <BadgeDollarSignIcon className="size-4" /> },
  { id: "section-ubicacion", label: "Ubicación", icon: <MapPinIcon className="size-4" /> },
  { id: "section-media", label: "Fotos, video y plano", icon: <ImageIcon className="size-4" /> },
  { id: "section-seo", label: "Google (SEO)", icon: <SearchIcon className="size-4" /> },
];

export default async function NuevaPropiedadPage() {
  const { tenant } = await requireTenantAdmin();
  const options = await estateOptions(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/gestion/propiedades"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Propiedades
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Nueva propiedad
          </h1>
        </div>
        <Link
          href="/admin/gestion/categorias"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
        >
          <Tags className="size-4" />
          Categorías
        </Link>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[210px_1fr]">
        <SectionNav items={NAV_ITEMS} />
        <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-7">
          <RecordForm module="propiedades" options={options} />
        </section>
      </div>
    </div>
  );
}
