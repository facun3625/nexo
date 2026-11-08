import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRoleToggle, UserDeleteButton } from "../user-row-actions";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session, tenant } = await requireTenantAdmin();

  const user = await prisma.user.findUnique({ where: { id, tenantId: tenant.id } });

  if (!user) notFound();

  const isSelf = user.id === session?.user.id;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          render={<Link href="/admin/usuarios" aria-label="Volver a usuarios" />}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-xl font-semibold">{user.name || "Sin nombre"}</h1>
        {user.role === "ADMIN" && <Badge>Admin</Badge>}
        {isSelf && <Badge variant="secondary">Vos</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Email</span>
          <span className="text-sm font-medium">{user.email}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Teléfono</span>
          <span className="text-sm font-medium">{user.phone || "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Dirección</span>
          <span className="text-sm font-medium">{user.address || "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Se unió</span>
          <span className="text-sm font-medium">{dateFormatter.format(user.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
        <label className="flex items-center gap-2.5 text-sm">
          <UserRoleToggle id={user.id} role={user.role} disabled={isSelf} />
          <span className="font-medium">Es admin</span>
        </label>
        <UserDeleteButton id={user.id} label={user.name || user.email} disabled={isSelf} />
        {isSelf && (
          <span className="text-xs text-muted-foreground">
            No podés cambiar tu propio rol ni borrar tu cuenta desde acá.
          </span>
        )}
      </div>
    </div>
  );
}
