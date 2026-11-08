import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const cities = await prisma.city.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(cities);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const city = await prisma.city.create({ data: { name } });
  return NextResponse.json(city, { status: 201 });
}
