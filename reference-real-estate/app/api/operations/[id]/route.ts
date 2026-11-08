import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, whatsapp, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const op = await prisma.operationType.update({ where: { id }, data: { name, whatsapp: whatsapp || null, color: color || "#df691a" } });
  return NextResponse.json(op);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.operationType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
