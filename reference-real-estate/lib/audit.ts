import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createAuditLog(
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "PASSWORD_CHANGE",
  entityType: "Property" | "User" | "SiteConfig" | "ContentBlock" | "Consorcio",
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    const session = await getSession();
    
    // Si es login, el session es null justo antes del login, o si estamos logueando por primera vez.
    // En ese caso, el userId lo sacamos de los detalles si es posible.
    
    await prisma.auditLog.create({
      data: {
        userId: (session as any)?.id || null,
        userName: (session as any)?.username || "System",
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
