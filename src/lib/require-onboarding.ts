import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Alguien logueado que todavía no tiene tienda
// propia — está en algún paso de /registro. Un CUSTOMER de una tienda real
// tiene tenantId seteado y no cae acá.
//
// La sesión es JWT y no se refresca sola: si ya terminó el onboarding hace
// un rato (tenantId seteado en la base), el token viejo puede seguir
// diciendo tenantId null hasta que vuelva a loguearse. Por eso acá se
// verifica siempre contra la base, no contra lo que dice el token — si no,
// alguien que ya tiene tienda podría quedar reingresando al flujo de alta
// con una sesión vieja.
export async function requireOnboardingUser() {
  const session = await auth();
  if (!session?.user) redirect("/registro");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "CUSTOMER" || user.tenantId) redirect("/registro");

  return { ...session, user: { ...session.user, id: user.id } };
}
