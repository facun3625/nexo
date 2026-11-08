import { ORIENTATIONS, PET_POLICIES, CREDIT_OPTIONS } from "./property-features";

export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: readonly string[];
  relation?: string;
  hint?: string;
  // Dato interno que nunca se muestra en el sitio público — ver record-form.tsx.
  private?: boolean;
};
export type Module = {
  title: string;
  singular: string;
  description: string;
  fields: Field[];
};
export const modules: Record<string, Module> = {
  operaciones: {
    title: "Operaciones",
    singular: "operación",
    description:
      "Negociaciones, reservas y cierres. Al reservar o cerrar se actualiza la disponibilidad de la oferta.",
    fields: [
      {
        name: "propertyId",
        label: "Propiedad",
        relation: "properties",
        required: true,
      },
      {
        name: "contactId",
        label: "Comprador / inquilino",
        relation: "contacts",
        required: true,
      },
      { name: "operation", label: "Operación", options: ["SALE", "RENT"] },
      {
        name: "stage",
        label: "Etapa",
        options: ["NEGOTIATION", "RESERVED", "WON", "LOST"],
      },
      { name: "amount", label: "Importe acordado", type: "decimal" },
      { name: "currency", label: "Moneda", options: ["USD", "ARS"] },
      { name: "agentName", label: "Agente", required: true },
      {
        name: "notes",
        label: "Seguimiento / motivo de pérdida",
        type: "textarea",
      },
    ],
  },
  tasaciones: {
    title: "Tasaciones",
    singular: "tasación",
    description: "Solicitudes, relevamiento y valoración de inmuebles.",
    fields: [
      {
        name: "contactId",
        label: "Solicitante",
        relation: "contacts",
        required: true,
      },
      { name: "address", label: "Dirección", required: true },
      { name: "propertyType", label: "Tipo de inmueble", required: true },
      {
        name: "status",
        label: "Estado",
        options: ["NEW", "CONTACTED", "COMPLETED", "CANCELLED"],
      },
      { name: "amount", label: "Valor estimado", type: "decimal" },
      { name: "currency", label: "Moneda", options: ["USD", "ARS"] },
      { name: "notes", label: "Informe / observaciones", type: "textarea" },
    ],
  },
  clientes: {
    title: "Clientes y contactos",
    singular: "contacto",
    description: "Propietarios, interesados e inquilinos en una misma agenda.",
    fields: [
      { name: "name", label: "Nombre o razón social", required: true },
      { name: "email", label: "Email de contacto", type: "email" },
      { name: "phone", label: "Teléfono" },
      { name: "taxId", label: "DNI / CUIT" },
      { name: "address", label: "Dirección" },
      { name: "birthDate", label: "Fecha de nacimiento", type: "date" },
      { name: "occupation", label: "Ocupación / lugar de trabajo" },
      {
        name: "roles",
        label: "Roles",
        type: "roles",
        options: ["OWNER", "PROSPECT", "TENANT", "BUYER", "GUARANTOR"],
      },
      {
        name: "portalEnabled",
        label: "Habilitado para el portal del inquilino",
        type: "checkbox",
        hint: "Con esto activado y el DNI cargado, se puede registrar solo en /mi-alquiler/activar con su email y su DNI.",
      },
      {
        name: "ownerPortalEnabled",
        label: "Habilitado para el portal del propietario",
        type: "checkbox",
        hint: "Con esto activado y el DNI cargado, el propietario puede registrarse solo en /mi-propiedad/activar para ver sus propiedades y cobros.",
      },
      { name: "notes", label: "Notas privadas", type: "textarea" },
    ],
  },
  agentes: {
    title: "Agentes",
    singular: "agente",
    description:
      "Empleados de la inmobiliaria — elegilos como contacto de WhatsApp en cada oferta de una propiedad.",
    fields: [
      { name: "name", label: "Nombre y apellido", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Teléfono / WhatsApp", required: true },
    ],
  },
  propiedades: {
    title: "Propiedades",
    singular: "propiedad",
    description:
      "Tu cartera, sus propietarios y publicaciones de venta o alquiler.",
    fields: [
      { name: "section-publicacion", type: "section", label: "Publicación" },
      { name: "code", label: "Código interno", required: true },
      { name: "title", label: "Título de la publicación", required: true },
      { name: "published", label: "Publicar en el sitio", type: "checkbox" },
      { name: "featured", label: "Destacar", type: "checkbox" },
      { name: "propertyType", label: "Tipo" },
      {
        name: "offerType",
        label: "Tipo de oferta",
        options: ["SALE", "RENT", "RENT_TEMP", "BOTH"],
      },

      { name: "section-precio", type: "section", label: "Precio y características" },
      { name: "salePrice", label: "Precio de venta", type: "decimal" },
      {
        name: "saleCurrency",
        label: "Moneda de venta",
        options: ["USD", "ARS"],
      },
      { name: "rentPrice", label: "Alquiler", type: "decimal" },
      {
        name: "rentCurrency",
        label: "Moneda de alquiler",
        options: ["ARS", "USD"],
      },
      { name: "bedrooms", label: "Dormitorios", type: "number" },
      { name: "bathrooms", label: "Baños", type: "number" },
      { name: "garages", label: "Cocheras", type: "number" },
      {
        name: "coveredArea",
        label: "Superficie cubierta (m²)",
        type: "decimal",
      },
      { name: "totalArea", label: "Superficie total (m²)", type: "decimal" },
      { name: "orientation", label: "Orientación", options: ORIENTATIONS },
      { name: "petsPolicy", label: "Mascotas", options: PET_POLICIES },
      { name: "creditEligible", label: "Apto crédito", options: CREDIT_OPTIONS },
      { name: "description", label: "Descripción pública", type: "textarea" },

      { name: "section-ubicacion", type: "section", label: "Ubicación" },
      { name: "city", label: "Ciudad", required: true },
      { name: "neighborhood", label: "Barrio" },
      {
        name: "address",
        label: "Dirección privada",
        required: true,
        hint: "La web pública muestra solamente ciudad y barrio.",
        private: true,
      },
      { name: "ownerId", label: "Propietario", relation: "owners", private: true },
      {
        name: "latitude",
        label: "Ubicación en el mapa",
        type: "coordinate",
      },
      { name: "longitude", label: "Longitud", type: "coordinate" },

      { name: "section-media", type: "section", label: "Fotos, video y plano" },
      {
        name: "images",
        label: "Fotografías",
        type: "file",
        hint: "JPG, PNG o WEBP. Hasta 10 imágenes nuevas de 8 MB cada una; 18 MB por envío. La primera foto es la portada — reordená o borrá las existentes con los controles de cada miniatura.",
      },
      {
        name: "floorPlanUrl",
        label: "Plano opcional",
        type: "floor-plan",
        hint: "Imagen JPG, PNG o WEBP, o PDF. Hasta 8 MB. Fotos y plano: máximo 18 MB por envío.",
      },
      {
        name: "videoUrl",
        label: "Video",
        hint: "Pegá un link de YouTube, Vimeo, Google Drive o Dropbox — se reproduce en la publicación, no se sube ningún archivo al servidor.",
      },

      { name: "section-seo", type: "section", label: "Google (SEO)" },
      {
        name: "seoTitle",
        label: "Título para Google",
        hint: "Opcional. Vacío: se arma solo con tipo, operación, barrio, ciudad y precio (p. ej. «Departamento 1 dormitorio en venta en Candioti Norte, Santa Fe · USD 90.000»).",
      },
      {
        name: "seoDescription",
        label: "Descripción para Google",
        type: "textarea",
        hint: "Opcional. Es el texto que aparece debajo del título en Google y al compartir por WhatsApp. Vacío: se usa el comienzo de la descripción pública. Ideal: 140–160 caracteres.",
      },
    ],
  },
  consultas: {
    title: "Consultas inmobiliarias",
    singular: "consulta",
    description: "Seguimiento de cada oportunidad, desde el primer contacto.",
    fields: [
      {
        name: "contactId",
        label: "Contacto",
        relation: "contacts",
        required: true,
      },
      { name: "assignedAgentId", label: "Agente responsable", relation: "inquiryAgents" },
      { name: "propertyId", label: "Propiedad", relation: "properties" },
      { name: "message", label: "Consulta", type: "textarea", required: true },
      {
        name: "status",
        label: "Estado",
        options: ["NEW", "READ", "CONTACTED", "QUALIFIED", "CLOSED"],
      },
      { name: "notes", label: "Seguimiento privado", type: "textarea" },
    ],
  },
  visitas: {
    title: "Agenda de visitas",
    singular: "visita",
    description:
      "Coordiná encuentros y registrá sus resultados. Horarios de Argentina (UTC−3).",
    fields: [
      {
        name: "propertyId",
        label: "Propiedad",
        relation: "properties",
        required: true,
      },
      {
        name: "contactId",
        label: "Interesado",
        relation: "contacts",
        required: true,
      },
      { name: "agentName", label: "Agente responsable", required: true },
      {
        name: "startsAt",
        label: "Inicio",
        type: "datetime-local",
        required: true,
      },
      { name: "endsAt", label: "Fin", type: "datetime-local", required: true },
      {
        name: "status",
        label: "Estado",
        options: [
          "SCHEDULED",
          "CONFIRMED",
          "COMPLETED",
          "CANCELLED",
          "NO_SHOW",
        ],
      },
      { name: "notes", label: "Notas y resultado", type: "textarea" },
    ],
  },
  contratos: {
    title: "Contratos de alquiler",
    singular: "contrato",
    description:
      "Registrá las condiciones, vencimientos y actualizaciones — la generación de cuotas y los cálculos automáticos salen de estos datos.",
    fields: [
      { name: "section-partes", type: "section", label: "Partes y propiedad" },
      { name: "reference", label: "Referencia", required: true },
      {
        name: "propertyId",
        label: "Propiedad",
        relation: "properties",
        required: true,
      },
      {
        name: "contactId",
        label: "Inquilino",
        relation: "contacts",
        required: true,
      },
      // Sin options fijas: la lista sale de EstateContractType /
      // EstatePropertyDestination, editable desde "Categorías" en el
      // listado de Contratos (ver catalogKey en record-form.tsx).
      { name: "contractType", label: "Tipo de contrato" },
      { name: "propertyDestination", label: "Destino del inmueble" },

      { name: "section-vigencia", type: "section", label: "Vigencia y alquiler" },
      { name: "startsAt", label: "Inicio", type: "date", required: true },
      { name: "endsAt", label: "Fecha de finalización", type: "date", required: true },
      {
        name: "amount",
        label: "Alquiler mensual",
        type: "decimal",
        required: true,
      },
      { name: "currency", label: "Moneda", options: ["ARS", "USD"] },
      {
        name: "status",
        label: "Estado",
        options: ["DRAFT", "ACTIVE", "ENDED", "CANCELLED"],
      },
      { name: "dueDay", label: "Día de vencimiento mensual", type: "number" },
      { name: "graceDays", label: "Días de gracia", type: "number" },
      {
        name: "firstChargePeriod",
        label: "Generar primera cuota desde",
        type: "month",
        hint: "Solo se guarda — hoy no hay generación automática de cuotas todavía.",
      },
      {
        name: "paymentMethod",
        label: "Forma habitual de pago",
        options: ["TRANSFER", "MERCADOPAGO", "CASH", "OWNER_DIRECT"],
      },
      { name: "collectedBy", label: "Quién cobra el alquiler", options: ["AGENCY", "OWNER"] },
      { name: "lateFeeEnabled", label: "Aplicar punitorios", type: "checkbox" },
      { name: "lateFeeType", label: "Tipo de punitorio", options: ["PERCENTAGE", "FIXED"] },
      { name: "lateFeeValue", label: "Valor del punitorio", type: "decimal" },
      { name: "lateFeeFromDay", label: "Desde qué día", type: "number" },
      {
        name: "lateFeeFrequency",
        label: "Frecuencia del punitorio",
        options: ["DAILY", "MONTHLY", "ONCE"],
      },
      { name: "lateFeeCap", label: "Tope opcional", type: "decimal" },

      { name: "section-actualizacion", type: "section", label: "Actualización" },
      {
        name: "updateType",
        label: "Tipo de actualización",
        options: ["NONE", "IPC", "ICL", "FIXED_PERCENT", "STEPPED", "MANUAL", "OTHER_INDEX"],
      },
      {
        name: "updateFrequency",
        label: "Frecuencia de actualización",
        options: ["MONTHLY", "QUARTERLY", "FOUR_MONTHLY", "SEMIANNUAL", "ANNUAL", "CUSTOM"],
      },
      { name: "firstUpdateAt", label: "Primera actualización", type: "date" },
      { name: "updatePercent", label: "Porcentaje fijo", type: "decimal" },
      {
        name: "updateRounding",
        label: "Redondeo",
        options: ["EXACT", "ROUND_100", "ROUND_1000"],
      },
      {
        name: "adjustmentNotes",
        label: "Observaciones de actualización",
        type: "textarea",
      },

      { name: "section-deposito", type: "section", label: "Depósito y garantía" },
      { name: "hasDeposit", label: "¿Tiene depósito?", type: "checkbox" },
      { name: "depositAmount", label: "Importe del depósito", type: "decimal" },
      { name: "depositCurrency", label: "Moneda del depósito", options: ["ARS", "USD"] },
      { name: "depositInstallments", label: "Cantidad de cuotas", type: "number" },
      {
        name: "depositStatus",
        label: "Estado del depósito",
        options: ["PENDING", "PARTIAL", "PAID"],
      },
      { name: "depositHeldBy", label: "Quién conserva el depósito", options: ["AGENCY", "OWNER"] },
      {
        name: "guaranteeType",
        label: "Tipo de garantía",
        options: ["OWNER_PROPERTY", "INSURANCE", "PAYSLIP", "BOND", "OTHER"],
      },
      { name: "guaranteeExpiresAt", label: "Vencimiento de la garantía", type: "date" },

      { name: "notes", label: "Notas privadas", type: "textarea" },
    ],
  },
  cobranzas: {
    title: "Cobranzas",
    singular: "obligación",
    description: "Cuotas de alquiler, saldos y registro de cobros parciales.",
    fields: [
      {
        name: "contractId",
        label: "Contrato de alquiler",
        relation: "contracts",
        required: true,
      },
      { name: "concept", label: "Concepto", required: true },
      { name: "period", label: "Período", type: "month", required: true },
      { name: "dueAt", label: "Vencimiento", type: "date", required: true },
      { name: "amount", label: "Importe", type: "decimal", required: true },
      { name: "currency", label: "Moneda", options: ["ARS", "USD"] },
    ],
  },
  emprendimientos: {
    title: "Obras",
    singular: "obra",
    description: "Agrupá propiedades de un mismo proyecto.",
    fields: [
      { name: "name", label: "Nombre", required: true },
      { name: "address", label: "Dirección", required: true },
      { name: "city", label: "Ciudad", required: true },
      {
        name: "stage",
        label: "Etapa",
        options: ["PROJECT", "CONSTRUCTION", "FINISHED"],
      },
      { name: "description", label: "Descripción", type: "textarea" },
    ],
  },
};
export const labels: Record<string, string> = {
  NEGOTIATION: "Negociación",
  WON: "Concretada",
  LOST: "Perdida",
  OWNER: "Propietario",
  PROSPECT: "Interesado",
  TENANT: "Inquilino",
  BUYER: "Comprador",
  GUARANTOR: "Garante",
  NEW: "Ingresada",
  READ: "Leída",
  CONTACTED: "Contactada",
  QUALIFIED: "Calificada",
  CLOSED: "Cerrada",
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Ausente",
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  ENDED: "Finalizado",
  PROJECT: "Proyecto",
  CONSTRUCTION: "En construcción",
  FINISHED: "Terminado",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
  OPEN: "Abierto",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelto",
  SALE: "Venta",
  RENT: "Alquiler",
  RENT_TEMP: "Alquiler temporario",
  BOTH: "Venta o alquiler",
  AVAILABLE: "Disponible",
  RESERVED: "Reservada",
  SOLD: "Vendida",
  RENTED: "Alquilada",
  TRANSFER: "Transferencia",
  CASH: "Efectivo",
  MERCADOPAGO: "Mercado Pago",
  OWNER_DIRECT: "Pago directo al propietario",
  AGENCY: "La inmobiliaria",
  PERCENTAGE: "Porcentaje",
  FIXED: "Monto fijo",
  DAILY: "Diaria",
  MONTHLY: "Mensual",
  ONCE: "Único",
  NONE: "Sin actualización",
  IPC: "IPC",
  ICL: "ICL",
  FIXED_PERCENT: "Porcentaje fijo",
  STEPPED: "Escalonado",
  MANUAL: "Manual",
  OTHER_INDEX: "Otro índice",
  QUARTERLY: "Trimestral",
  FOUR_MONTHLY: "Cuatrimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
  CUSTOM: "Personalizada",
  EXACT: "Exacto",
  ROUND_100: "A $100",
  ROUND_1000: "A $1.000",
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  OWNER_PROPERTY: "Propietaria",
  INSURANCE: "Seguro de caución",
  PAYSLIP: "Recibo de sueldo",
  BOND: "Fianza",
  OTHER: "Otra",
  AGENCY_ONLY: "Solo inmobiliaria",
  BOTH_PARTIES: "Ambas partes",
  SIGNED_CONTRACT: "Contrato firmado",
  INVENTORY: "Inventario",
  DELIVERY_ACT: "Acta de entrega",
};
export function money(
  value: { toString(): string } | number | string,
  currency: string,
) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
export function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeZone: "America/Argentina/Cordoba",
  }).format(value);
}

export function argentinaDayStart(now = new Date()) {
  const day = new Date(now.getTime() - 3 * 3600000).toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00-03:00`);
}

// Mismo criterio de estado en todos lados donde se muestra un cargo: la
// lista de Cobranzas y el resumen de cuenta corriente de la ficha de
// cliente (ver estateCharge en clientes/[id]/page.tsx).
// Clases del badge de estado en la lista de Consultas — un color suave
// (nunca saturado, para no ensuciar la lista) por cada estado, así se
// distinguen entre sí de un vistazo. "Nueva" queda la más marcada de las
// cuatro a propósito, porque es la única que hace falta detectar rápido
// (abrir la consulta la pasa sola a "Leída").
export function consultaStatusBadgeClass(status: string): string {
  switch (status) {
    case "NEW":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold";
    case "READ":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "CONTACTED":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "QUALIFIED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "CLOSED":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}
export function chargeStatus(
  charge: { cancelled: boolean; dueAt: Date },
  balance: { isZero(): boolean; greaterThan(n: number): boolean },
  paid: { greaterThan(n: number): boolean },
) {
  if (charge.cancelled) return "Anulada";
  if (balance.isZero()) return "Pagada";
  if (charge.dueAt < argentinaDayStart()) return "Vencida";
  if (paid.greaterThan(0)) return "Pago parcial";
  return "Pendiente";
}
