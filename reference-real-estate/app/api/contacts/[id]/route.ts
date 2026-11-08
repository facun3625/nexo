import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, notes } = await req.json();
  const updated = await (prisma as any).contactRequest.update({ where: { id }, data: { status, notes } });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await (prisma as any).contactRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
