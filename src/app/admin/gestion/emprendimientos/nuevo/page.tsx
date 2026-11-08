import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { DevelopmentEditor } from "../development-editor";

export default async function NewDevelopmentPage() {
  const { tenant } = await requireTenantAdmin();
  const categories = await prisma.estateDevelopmentCategory.findMany({
    where: { tenantId: tenant.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nueva obra</h1>
      <DevelopmentEditor categories={categories} />
    </div>
  );
}
