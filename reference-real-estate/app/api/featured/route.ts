import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      imageUrl: true,
      type: true,
      propertyType: true,
      city: true,
      price: true,
      currency: true,
      pricePerMonth: true,
      featured: true,
      featuredOrder: true,
      published: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(properties);
}

// Body: { orderedIds: string[] } — lista ordenada de IDs que deben ser featured
export async function POST(req: Request) {
  const { orderedIds } = await req.json() as { orderedIds: string[] };
  const ids = orderedIds.slice(0, 6);

  // Quitar featured a todos
  await prisma.property.updateMany({ data: { featured: false, featuredOrder: null } });

  // Setear featured + orden a los seleccionados
  await Promise.all(
    ids.map((id, index) =>
      prisma.property.update({ where: { id }, data: { featured: true, featuredOrder: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
