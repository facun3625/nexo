import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
    try {
        const consorcios = await prisma.consorcio.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(consorcios);
    } catch (error) {
        console.error("GET Consorcios Error:", error);
        return NextResponse.json({ error: "Error fetching consorcios" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, banco, titular, cuit, cbu, ca, order, active } = body;

        const consorcio = await prisma.consorcio.create({
            data: {
                nombre,
                banco,
                titular,
                cuit,
                cbu,
                ca,
                order: order ?? 0,
                active: active ?? true,
            },
        });

        await createAuditLog("CREATE", "Consorcio", consorcio.id, { nombre: consorcio.nombre });

        return NextResponse.json(consorcio);
    } catch (error) {
        console.error("POST Consorcio Error:", error);
        return NextResponse.json({ error: "Error creating consorcio" }, { status: 500 });
    }
}
