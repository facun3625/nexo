import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

// Portal del propietario — mismo criterio que getPortalContact (inquilino)
// pero sin mezclar las dos entidades. La página decide qué mostrar en cada
// caso (login, "esta cuenta no tiene acceso", etc.) sin lanzar errores.
export async function getOwnerPortalContact() {
  const tenant = await getCurrentTenant();
  if (!tenant) return { tenant: null, session: null, contact: null };

  const session = await auth();
  if (!session?.user || session.user.tenantId !== tenant.id) {
    return { tenant, session: null, contact: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { contactId: true },
  });
  if (!user?.contactId) return { tenant, session, contact: null };

  const contact = await prisma.estateContact.findFirst({
    where: { id: user.contactId, tenantId: tenant.id, ownerPortalEnabled: true },
  });
  return { tenant, session, contact };
}
