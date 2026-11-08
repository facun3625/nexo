import { Building2, CalendarDays, KeyRound, MessageCircle, type LucideIcon } from "lucide-react";

export const FAQ_CATEGORIES: { icon: LucideIcon; title: string; questions: [string, string][] }[] = [
  {
    icon: Building2,
    title: "Propiedades",
    questions: [
      ["¿Cómo busco una propiedad?", "Desde Propiedades podés filtrar por operación, tipo, zona y precio para encontrar lo que buscás."],
      ["¿La información de precio y estado está actualizada?", "Sí, el equipo mantiene el catálogo actualizado a medida que cambia la disponibilidad de cada propiedad."],
      ["¿Puedo guardar propiedades que me interesan?", "Sí, podés marcar propiedades como favoritas y crear alertas de búsqueda para recibir avisos de nuevas publicaciones."],
    ],
  },
  {
    icon: CalendarDays,
    title: "Consultas y visitas",
    questions: [
      ["¿Cómo consulto por una propiedad?", "Desde la ficha de cada propiedad podés enviarnos una consulta con tus datos de contacto, o escribirnos directamente por WhatsApp."],
      ["¿Cómo coordino una visita?", "Después de tu consulta, un agente se pone en contacto para coordinar día y horario según tu disponibilidad."],
      ["¿Tienen estudio de arquitectura?", "Sí, además de la inmobiliaria tenemos un estudio de arquitectura. Podés ver el equipo, los servicios y nuestras obras en la sección Arquitectura del sitio."],
    ],
  },
  {
    icon: KeyRound,
    title: "Alquileres",
    questions: [
      ["¿Tienen un portal para inquilinos?", "Sí, si tu contrato está activado para el portal podés entrar a Mi alquiler con tu email y DNI para ver tu contrato, cuotas y documentos."],
      ["¿Cómo pago mi alquiler?", "La forma de cobro depende de cada contrato (transferencia, efectivo u otro medio) — consultalo con tu agente a cargo."],
      ["¿Qué pasa si tengo un problema con la propiedad alquilada?", "Podés contactarnos directamente para coordinar la solución correspondiente."],
    ],
  },
  {
    icon: MessageCircle,
    title: "Contacto",
    questions: [
      ["¿Cómo contacto al equipo?", "Usá el formulario de Contacto o escribinos por WhatsApp desde cualquier página del sitio."],
      ["¿Necesito una cuenta para consultar?", "No, podés consultar sin ninguna cuenta. También podés guardar favoritos y crear alertas sin registrarte."],
    ],
  },
];
