import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const ops = await prisma.operationType.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(ops);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { name, whatsapp, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const op = await prisma.operationType.create({ data: { name, whatsapp: whatsapp || null, color: color || "#df691a" } });
  return NextResponse.json(op, { status: 201 });
}
