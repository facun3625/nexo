import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || (session as any).role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to 100 most recent
  });

  return NextResponse.json(logs);
}
