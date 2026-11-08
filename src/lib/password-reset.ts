import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// El identifier de VerificationToken incluye el tenantId — el mismo email
// puede tener cuenta en varias tiendas distintas, y esto evita que un link
// de recuperación de una tienda sirva para resetear la cuenta de otra.
function scopedIdentifier(tenantId: string, email: string) {
  return `${tenantId}:${email}`;
}

export async function createPasswordResetToken(tenantId: string, email: string) {
  const token = randomBytes(32).toString("hex");
  const identifier = scopedIdentifier(tenantId, email);
  // Un solo link válido a la vez — pedir uno nuevo invalida el anterior.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

export async function consumePasswordResetToken(tenantId: string, email: string, token: string) {
  const identifier = scopedIdentifier(tenantId, email);
  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });
  if (!row) return false;
  await prisma.verificationToken.delete({ where: { identifier_token: { identifier, token } } });
  return row.expires >= new Date();
}
