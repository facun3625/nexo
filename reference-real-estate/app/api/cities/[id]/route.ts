import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const city = await prisma.city.update({ where: { id }, data: { name } });
  return NextResponse.json(city);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.city.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
