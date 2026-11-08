import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Role } from "@/generated/prisma/client";
import { UsersFilterBar } from "./users-filter-bar";
import { UserRoleToggle, UserDeleteButton } from "./user-row-actions";
import { CreateAdminDialog } from "./create-admin-dialog";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });
const PAGE_SIZE = 30;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string; page?: string }>;
}) {
  const { session, tenant } = await requireTenantAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    tenantId: tenant.id,
    ...(params.rol ? { role: params.rol as Role } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.rol) sp.set("rol", params.rol);
    sp.set("page", String(p));
    return `/admin/usuarios?${sp.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <CreateAdminDialog />
      </div>

      <UsersFilterBar />

      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "usuario" : "usuarios"}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Se unió</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = u.id === session?.user.id;
            return (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/usuarios/${u.id}`} className="hover:text-primary">
                    {u.name || "Sin nombre"}
                  </Link>
                  {isSelf && <Badge variant="secondary" className="ml-2">Vos</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{dateFormatter.format(u.createdAt)}</TableCell>
                <TableCell>
                  <UserRoleToggle id={u.id} role={u.role} disabled={isSelf} />
                </TableCell>
                <TableCell className="text-right">
                  <UserDeleteButton id={u.id} label={u.name || u.email} disabled={isSelf} />
                </TableCell>
              </TableRow>
            );
          })}

          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay usuarios que coincidan con esa búsqueda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} render={<Link href={pageHref(page - 1)} />}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            render={<Link href={pageHref(page + 1)} />}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
