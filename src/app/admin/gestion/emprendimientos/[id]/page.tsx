import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { DevelopmentEditor } from "../development-editor";
import { DevelopmentRowActions } from "../development-row-actions";

export default async function EditDevelopmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { id } = await params;
  const [development, categories] = await Promise.all([
    prisma.estateDevelopment.findUnique({
      where: { id, tenantId: tenant.id },
      include: {
        fields: { orderBy: { order: "asc" } },
        images: { orderBy: { order: "asc" } },
      },
    }),
    prisma.estateDevelopmentCategory.findMany({
      where: { tenantId: tenant.id },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!development) notFound();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editar obra</h1>
        <DevelopmentRowActions
          id={id}
          name={development.name}
          showEdit={false}
        />
      </div>
      <DevelopmentEditor
        categories={categories}
        development={{
          ...development,
          latitude: development.latitude?.toString() ?? null,
          longitude: development.longitude?.toString() ?? null,
        }}
      />
    </div>
  );
}
