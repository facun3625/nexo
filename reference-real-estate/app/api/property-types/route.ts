import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.propertyType.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(types);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const type = await prisma.propertyType.create({ data: { name } });
  return NextResponse.json(type, { status: 201 });
}
