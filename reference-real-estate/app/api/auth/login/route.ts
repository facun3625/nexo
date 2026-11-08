import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  let user = await prisma.user.findUnique({
    where: { username },
  });

  // Bootstrap initial user if none exist
  if (!user) {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const adminUser = process.env.ADMIN_USERNAME || "admin";
      const adminPass = process.env.ADMIN_PASSWORD || "admin123";

      if (username === adminUser && password === adminPass) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            username: adminUser,
            passwordHash,
            name: "Super Admin",
            role: "superadmin",
          },
        });
      }
    }
  }

  if (!user || user.active === false) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await signToken({ 
    id: user.id,
    username: user.username, 
    role: user.role 
  });

  const res = NextResponse.json({ 
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  });

  // Track login log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userName: user.username,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    }
  });

  return res;
}
