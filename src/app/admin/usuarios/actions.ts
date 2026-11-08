"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { ActionError, toUserError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/activity-log";
import type { Role } from "@/generated/prisma/client";

export async function setUserRole(id: string, role: Role) {
  try {
    return await runSetUserRole(id, role);
  } catch (err) {
    return toUserError(err, "No se pudo guardar el usuario");
  }
}

async function runSetUserRole(id: string, role: Role) {
  const { session, tenant } = await requireTenantAdmin();
  if (session.user.id === id) {
    throw new ActionError("No podés cambiar tu propio rol");
  }

  if (role === "CUSTOMER") {
    const target = await prisma.user.findUnique({ where: { id, tenantId: tenant.id } });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { tenantId: tenant.id, role: "ADMIN" } });
      if (adminCount <= 1) throw new ActionError("Tiene que quedar al menos un admin");
    }
  }

  const updated = await prisma.user.update({ where: { id, tenantId: tenant.id }, data: { role } });
  await logActivity(tenant.id, { entity: "usuarios", entityId: id, action: "ROLE", summary: `Cambió el rol de ${updated.name || updated.email} a ${role}` }, { user: session.user });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { ok: true as const };
}

export async function deleteUser(id: string) {
  try {
    return await runDeleteUser(id);
  } catch (err) {
    return toUserError(err, "No se pudo guardar el usuario");
  }
}

async function runDeleteUser(id: string) {
  const { session, tenant } = await requireTenantAdmin();
  if (session.user.id === id) {
    throw new ActionError("No podés borrar tu propia cuenta");
  }

  const target = await prisma.user.findUnique({ where: { id, tenantId: tenant.id } });
  if (!target) throw new ActionError("Usuario no encontrado");

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { tenantId: tenant.id, role: "ADMIN" } });
    if (adminCount <= 1) throw new ActionError("Tiene que quedar al menos un admin");
  }

  await prisma.user.delete({ where: { id, tenantId: tenant.id } });
  await logActivity(tenant.id, { entity: "usuarios", entityId: id, action: "DELETE", summary: `Eliminó al usuario ${target.name || target.email}` }, { user: session.user });
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

const createAdminSchema = z.object({
  name: z.string().trim().min(1, "Ingresá el nombre").max(200),
  email: z.email("Ingresá un email válido").trim().toLowerCase(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72, "La contraseña es demasiado larga"),
});

// Crea el administrador listo para entrar: el email es su usuario de acceso.
export async function createAdmin(form: FormData) {
  try {
    return await runCreateAdmin(form);
  } catch (err) {
    return toUserError(err, "No se pudo crear el usuario");
  }
}

async function runCreateAdmin(form: FormData) {
  const { session, tenant } = await requireTenantAdmin();
  const parsed = createAdminSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) throw new ActionError(parsed.error.issues[0].message);
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (existing) throw new ActionError("Ya hay un usuario con ese email");

  const user = await prisma.user.create({
    data: { tenantId: tenant.id, name, email, role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  await logActivity(tenant.id, { entity: "usuarios", entityId: user.id, action: "CREATE", summary: `Creó al administrador ${email}` }, { user: session.user });

  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}
