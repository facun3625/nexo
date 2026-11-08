import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session || (session as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { username, password, name, role } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      username,
      passwordHash,
      name,
      role: role || "admin",
    },
  });

  await createAuditLog("CREATE", "User", newUser.id, { username, role });

  return NextResponse.json({ ok: true, user: { id: newUser.id, username: newUser.username } });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || (session as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, password, name, role, active } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (active !== undefined) data.active = active;
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
  });

  await createAuditLog("UPDATE", "User", id, { 
    username: updatedUser.username,
    role: data.role,
    passwordChanged: !!password 
  });

  return NextResponse.json({ ok: true });
}
