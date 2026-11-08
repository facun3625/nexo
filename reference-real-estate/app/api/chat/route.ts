import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function buildSystemPrompt(
  properties: {
    id: string;
    title: string;
    type: string;
    propertyType: string;
    price: number;
    city: string;
    address: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    totalArea?: number | null;
    coveredArea?: number | null;
    hasGarage: boolean;
    description: string;
  }[],
  contact: {
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
  } | null,
  aiInstructions?: string | null
) {
  const propList = properties.length
    ? properties
        .map((p) => {
          const extras = [
            p.bedrooms ? `${p.bedrooms} dorm.` : null,
            p.bathrooms ? `${p.bathrooms} baños` : null,
            p.totalArea ? `${p.totalArea}m² totales` : null,
            p.coveredArea ? `${p.coveredArea}m² cubiertos` : null,
            p.hasGarage ? "cochera" : null,
          ]
            .filter(Boolean)
            .join(", ");
          return `- [${p.id}] ${p.title} | ${p.type} | ${p.propertyType} | $${p.price.toLocaleString("es-AR")} | ${p.city}, ${p.address}${extras ? ` | ${extras}` : ""}\n  Descripción: ${p.description.slice(0, 120)}${p.description.length > 120 ? "…" : ""}`;
        })
        .join("\n")
    : "No hay propiedades cargadas actualmente.";

  const contactInfo = contact
    ? [
        contact.phone ? `Teléfono: ${contact.phone}` : null,
        contact.whatsapp ? `WhatsApp: ${contact.whatsapp}` : null,
        contact.email ? `Email: ${contact.email}` : null,
        contact.address ? `Oficina: ${contact.address}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "Santa Fe, Argentina";

  return `Sos Lena, agente inmobiliaria virtual de Penalva Inmobiliaria — más de 20 años de trayectoria en Santa Fe, Argentina.

PROPIEDADES DISPONIBLES (datos reales, actualizados):
${propList}

Para compartir el link de una propiedad usá formato markdown: [Título de la propiedad](/propiedad/ID)
Ejemplo: si el título es "Casa céntrica" y el ID es "abc123", escribís: [Casa céntrica](/propiedad/abc123)

DATOS DE CONTACTO:
${contactInfo}

INSTRUCCIONES GENERALES:
- Respondés en español rioplatense (vos, ustedes)
- Usás los datos reales de arriba para responder preguntas sobre propiedades (precio, ubicación, características)
- Cuando recomendás una propiedad, compartí el link usando formato markdown: [Título de la propiedad](/propiedad/[ID]) — nunca pongas el link suelto como texto plano
- Si el usuario pide algo que no está en el listado, decís que no tenés esa opción actualmente y ofrecés alternativas
- Podés filtrar por tipo (Venta/Alquiler), ciudad, dormitorios, precio, etc.
- Respuestas concisas, máximo 4-5 oraciones salvo listados
- No inventés datos que no estén en el listado

DERIVAR A AGENTE HUMANO:
- Si el usuario tiene una consulta compleja que no podés resolver bien (ej: negociación, situación legal, urgencia, múltiples intentos fallidos), ofrecé conectarlo con un asesor humano de Penalva.
- Decile algo como: "Para esto te conviene hablar directamente con uno de nuestros asesores. ¿Querés que te contactemos? Solo necesito tu nombre y teléfono o email."
- Cuando el usuario te dé su nombre y al menos teléfono o email, emitís este token EXACTO al inicio de tu respuesta (sin espacios antes):
[GUARDAR_CONTACTO:{"nombre":"<nombre>","telefono":"<telefono o vacío>","email":"<email o vacío>","consulta":"<resumen de 1 oración de la consulta>"}]
- Luego del token, seguís con un mensaje de confirmación amigable, ej: "¡Perfecto! Ya le pasé tus datos a nuestro equipo. Te van a contactar a la brevedad. ¿Puedo ayudarte con algo más?"
- IMPORTANTE: Emití el token una sola vez, solo cuando tenés nombre + (teléfono o email). Nunca lo emitas sin esos datos.${aiInstructions ? `\n\nINSTRUCCIONES ADICIONALES DE PENALVA:\n${aiInstructions}` : ""}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key no configurada" }, { status: 500 });
  }

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 });
  }

  const [properties, siteConfig, aiInstructions] = await Promise.all([
    prisma.property.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        type: true,
        propertyType: true,
        price: true,
        city: true,
        address: true,
        bedrooms: true,
        bathrooms: true,
        totalArea: true,
        coveredArea: true,
        hasGarage: true,
        description: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.siteConfig.findUnique({ where: { id: "singleton" } }),
    prisma.aIInstruction.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const instructionsText = aiInstructions.length
    ? aiInstructions.map((i, idx) => `${idx + 1}. ${i.text}`).join("\n")
    : null;

  const systemPrompt = buildSystemPrompt(properties, siteConfig, instructionsText);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: err }, { status: response.status });
  }

  const data = await response.json();
  let reply: string = data.choices?.[0]?.message?.content ?? "No se pudo obtener respuesta.";

  // Detectar token de contacto y guardar en DB
  const tokenMatch = reply.match(/\[GUARDAR_CONTACTO:(\{[\s\S]*?\})\]/);
  if (tokenMatch) {
    try {
      const contactData = JSON.parse(tokenMatch[1]);
      await (prisma as any).contactRequest.create({
        data: {
          nombre: contactData.nombre || "Sin nombre",
          telefono: contactData.telefono || null,
          email: contactData.email || null,
          consulta: contactData.consulta || null,
          source: "chat",
        },
      });
    } catch {}
    // Eliminar el token del mensaje mostrado al usuario
    reply = reply.replace(/\[GUARDAR_CONTACTO:\{[\s\S]*?\}\]/, "").trimStart();
  }

  return NextResponse.json({ reply, contactSaved: !!tokenMatch });
}
