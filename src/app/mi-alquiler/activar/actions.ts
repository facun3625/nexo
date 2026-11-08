"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import { ActionError, toUserError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { LOGIN_RULE, LOGIN_IP_RULE, clientIp, isRateLimited, recordFailure } from "@/lib/rate-limit";

// Alta del portal del inquilino (Etapa 2) — a diferencia de "Invitar
// administrador" (que manda un mail), acá el inquilino se registra solo:
// cruza email + DNI contra el EstateContact que la inmobiliaria ya habilitó
// (portalEnabled) y con esos datos cargados. Si coincide, crea el User
// vinculado (contactId) y la contraseña se define en el mismo paso.
export async function activatePortalAccount(form: FormData) {
  try {
    return await runActivatePortalAccount(form);
  } catch (err) {
    return toUserError(err, "No se pudo activar la cuenta");
  }
}

async function runActivatePortalAccount(form: FormData) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new ActionError("Tienda no encontrada");

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const taxId = String(form.get("taxId") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !taxId) throw new ActionError("Completá tu email y tu DNI");
  if (password.length < 6)
    throw new ActionError("La contraseña tiene que tener al menos 6 caracteres");

  // Mismo criterio de freno de fuerza bruta que el login: alguien probando
  // combinaciones de DNI contra un email conocido, o barriendo emails desde
  // una sola IP.
  const hdrs = await headers();
  const accountKey = `portal-activate:${tenant.id}:${email}`;
  const ipKey = `portal-activate-ip:${clientIp(hdrs)}`;
  const [accountBlocked, ipBlocked] = await Promise.all([
    isRateLimited(accountKey, LOGIN_RULE),
    isRateLimited(ipKey, LOGIN_IP_RULE),
  ]);
  if (accountBlocked || ipBlocked)
    throw new ActionError("Demasiados intentos. Probá de nuevo en un rato.");

  const contact = await prisma.estateContact.findFirst({
    where: { tenantId: tenant.id, email, taxId, portalEnabled: true },
  });
  if (!contact) {
    await Promise.all([recordFailure(accountKey), recordFailure(ipKey)]);
    throw new ActionError(
      "No encontramos una cuenta habilitada con esos datos. Consultá con la inmobiliaria.",
    );
  }

  const existingLink = await prisma.user.findUnique({ where: { contactId: contact.id } });
  if (existingLink)
    throw new ActionError(
      "Ya existe una cuenta para este contacto — iniciá sesión, o recuperá tu contraseña si no la recordás.",
    );

  const existingEmailUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (existingEmailUser)
    throw new ActionError("Ya hay una cuenta con ese email en esta tienda — iniciá sesión.");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      name: contact.name,
      passwordHash,
      role: "CUSTOMER",
      contactId: contact.id,
    },
  });

  return { ok: true as const };
}
