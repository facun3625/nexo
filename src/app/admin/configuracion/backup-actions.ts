"use server";

import { revalidatePath } from "next/cache";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";
import { createDatabaseBackup } from "@/lib/backup";
import { logActivity } from "@/lib/activity-log";

export async function createBackupNow() {
  try {
    const { tenant, session } = await requireTenantAdmin();
    if (session.user.role !== "ADMIN") throw new ActionError("Solo un administrador puede crear copias de seguridad");
    const result = await createDatabaseBackup();
    await logActivity(tenant.id, { entity: "configuracion", action: "BACKUP_CREATE", summary: `Creó una copia de seguridad (${result.filename})` }, { user: session.user });
    revalidatePath("/admin/configuracion");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo crear la copia de seguridad");
  }
}
