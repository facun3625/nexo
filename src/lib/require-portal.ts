import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

// Portal del inquilino (Etapa 3) — a diferencia de requireTenantAdmin, acá
// no se tira un error si falta la sesión o el vínculo: la página decide qué
// mostrar en cada caso (login, o "esta cuenta no tiene acceso").
export async function getPortalContact() {
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
    where: { id: user.contactId, tenantId: tenant.id },
  });
  return { tenant, session, contact };
}
