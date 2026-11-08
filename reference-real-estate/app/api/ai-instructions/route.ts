import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const instructions = await prisma.aIInstruction.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(instructions);
}

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
  }
  const instruction = await prisma.aIInstruction.create({
    data: { text: text.trim() },
  });
  return NextResponse.json(instruction);
}
