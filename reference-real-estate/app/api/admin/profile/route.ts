import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: (session as any).id },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  await createAuditLog("PASSWORD_CHANGE", "User", user.id, {
    username: user.username,
  });

  return NextResponse.json({ ok: true });
}
