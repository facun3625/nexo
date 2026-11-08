import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, verifyUnsubscribe } from "@/lib/email-marketing/data";

// Da de baja un mail (suscriptor o contacto del CRM). Devuelve false si
// el link no es válido.
export async function unsubscribeEmail(tenantId: string, rawEmail: string, token: string) {
  const email = normalizeEmail(rawEmail);
  if (!email || !token || !verifyUnsubscribe(tenantId, email, token)) return false;
  await prisma.emailSubscriber.upsert({
    where: { tenantId_email: { tenantId, email } },
    update: { unsubscribedAt: new Date() },
    create: { tenantId, email, source: "BAJA", unsubscribedAt: new Date() },
  });
  return true;
}
