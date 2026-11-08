import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
  }
  const instruction = await prisma.aIInstruction.update({
    where: { id },
    data: { text: text.trim() },
  });
  return NextResponse.json(instruction);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.aIInstruction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
