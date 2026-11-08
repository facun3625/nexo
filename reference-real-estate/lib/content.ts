import prisma from "./prisma";

// Todos los bloques de contenido con sus valores por defecto
export const CONTENT_DEFAULTS: Record<string, { label: string; page: string; multiline: boolean; value: string }> = {
  // HOME
  home_titulo:    { page: "home", label: "Título principal", multiline: false, value: "Buscar Propiedades" },
  home_subtitulo: { page: "home", label: "Subtítulo", multiline: false, value: "Encontrá la propiedad que estás buscando" },
  home_hero_img:  { page: "home", label: "Imagen destacada", multiline: false, value: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80" },

  // NOSOTROS
  nosotros_hero_titulo:        { page: "nosotros", label: "Hero — Título", multiline: false, value: "Nosotros" },
  nosotros_hero_subtitulo:     { page: "nosotros", label: "Hero — Subtítulo", multiline: false, value: "Más de 20 años construyendo confianza en el mercado inmobiliario de Santa Fe." },
  nosotros_hero_img:           { page: "nosotros", label: "Hero — Imagen", multiline: false, value: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80" },
  nosotros_hero_eyebrow:       { page: "nosotros", label: "Hero — Etiqueta superior", multiline: false, value: "La Empresa" },
  nosotros_empresa_titulo:     { page: "nosotros", label: "Empresa — Título", multiline: false, value: "Peñalva Inmobiliaria\nde P+P SRL" },
  nosotros_empresa_eyebrow:    { page: "nosotros", label: "Empresa — Etiqueta superior", multiline: false, value: "Quiénes somos" },
  nosotros_empresa_img:        { page: "nosotros", label: "Empresa — Imagen", multiline: false, value: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" },
  nosotros_empresa_p1:         { page: "nosotros", label: "Empresa — Párrafo 1", multiline: true, value: "La empresa Peñalva Inmobiliaria de P+P SRL, con más de veinte años de trayectoria en su actividad, justifica su permanencia en el mercado al brindar responsabilidad, honestidad y cumplimiento." },
  nosotros_empresa_p2:         { page: "nosotros", label: "Empresa — Párrafo 2", multiline: true, value: "Contamos para este fin con profesionales de reconocido prestigio y personal idóneo para asesorarlo en una buena defensa de su patrimonio." },
  nosotros_empresa_p3:         { page: "nosotros", label: "Empresa — Párrafo 3", multiline: true, value: "La trayectoria ha hecho de nuestro nombre un sinónimo de seriedad, confiabilidad y respeto por el cliente." },
  nosotros_empresa_quote:      { page: "nosotros", label: "Empresa — Frase destacada", multiline: false, value: '"Su consulta no es molestia, nos fortalece..."' },
  nosotros_horario:            { page: "nosotros", label: "Horario de atención", multiline: false, value: "Horario de atención: Lunes a Viernes, 08:00 a 17:00 hs." },
  nosotros_badge_valor:        { page: "nosotros", label: "Badge imagen — Número", multiline: false, value: "20+" },
  nosotros_badge_label:        { page: "nosotros", label: "Badge imagen — Texto", multiline: false, value: "Años de experiencia" },
  nosotros_stat1_valor:        { page: "nosotros", label: "Estadística 1 — Valor", multiline: false, value: "20+" },
  nosotros_stat1_label:        { page: "nosotros", label: "Estadística 1 — Etiqueta", multiline: false, value: "Años de experiencia" },
  nosotros_stat2_valor:        { page: "nosotros", label: "Estadística 2 — Valor", multiline: false, value: "500+" },
  nosotros_stat2_label:        { page: "nosotros", label: "Estadística 2 — Etiqueta", multiline: false, value: "Propiedades gestionadas" },
  nosotros_stat3_valor:        { page: "nosotros", label: "Estadística 3 — Valor", multiline: false, value: "300+" },
  nosotros_stat3_label:        { page: "nosotros", label: "Estadística 3 — Etiqueta", multiline: false, value: "Clientes satisfechos" },
  nosotros_stat4_valor:        { page: "nosotros", label: "Estadística 4 — Valor", multiline: false, value: "3" },
  nosotros_stat4_label:        { page: "nosotros", label: "Estadística 4 — Etiqueta", multiline: false, value: "Ciudades atendidas" },
  nosotros_valores_titulo:     { page: "nosotros", label: "Valores — Título", multiline: false, value: "Lo que nos define" },
  nosotros_valores_eyebrow:    { page: "nosotros", label: "Valores — Etiqueta superior", multiline: false, value: "Nuestros pilares" },
  nosotros_valor1_titulo:      { page: "nosotros", label: "Valores — Valor 1 Título", multiline: false, value: "Responsabilidad" },
  nosotros_valor1_desc:        { page: "nosotros", label: "Valores — Valor 1 Descripción", multiline: false, value: "Actuamos con plena responsabilidad en cada operación, protegiendo los intereses de nuestros clientes en todo momento." },
  nosotros_valor2_titulo:      { page: "nosotros", label: "Valores — Valor 2 Título", multiline: false, value: "Honestidad" },
  nosotros_valor2_desc:        { page: "nosotros", label: "Valores — Valor 2 Descripción", multiline: false, value: "La transparencia y la honestidad son la base de cada una de nuestras relaciones comerciales y personales." },
  nosotros_valor3_titulo:      { page: "nosotros", label: "Valores — Valor 3 Título", multiline: false, value: "Cumplimiento" },
  nosotros_valor3_desc:        { page: "nosotros", label: "Valores — Valor 3 Descripción", multiline: false, value: "Cumplimos nuestros compromisos con precisión y puntualidad, garantizando resultados concretos y verificables." },
  nosotros_valor4_titulo:      { page: "nosotros", label: "Valores — Valor 4 Título", multiline: false, value: "Trayectoria" },
  nosotros_valor4_desc:        { page: "nosotros", label: "Valores — Valor 4 Descripción", multiline: false, value: "Más de dos décadas en el mercado inmobiliario de Santa Fe nos avalan como referentes del sector." },
  nosotros_equipo_titulo:      { page: "nosotros", label: "Equipo — Título", multiline: false, value: "Nuestro equipo" },
  nosotros_equipo_eyebrow:     { page: "nosotros", label: "Equipo — Etiqueta superior", multiline: false, value: "Staff" },
  nosotros_miembro1_nombre:    { page: "nosotros", label: "Equipo — Miembro 1 Nombre", multiline: false, value: "Marcelo Penalva" },
  nosotros_miembro1_rol:       { page: "nosotros", label: "Equipo — Miembro 1 Rol", multiline: false, value: "Director General" },
  nosotros_miembro1_desc:      { page: "nosotros", label: "Equipo — Miembro 1 Descripción", multiline: false, value: "Más de 20 años liderando el equipo y garantizando la excelencia en cada operación." },
  nosotros_miembro2_nombre:    { page: "nosotros", label: "Equipo — Miembro 2 Nombre", multiline: false, value: "Equipo Comercial" },
  nosotros_miembro2_rol:       { page: "nosotros", label: "Equipo — Miembro 2 Rol", multiline: false, value: "Asesores de Ventas" },
  nosotros_miembro2_desc:      { page: "nosotros", label: "Equipo — Miembro 2 Descripción", multiline: false, value: "Profesionales especializados en compra y venta de propiedades residenciales y comerciales." },
  nosotros_miembro3_nombre:    { page: "nosotros", label: "Equipo — Miembro 3 Nombre", multiline: false, value: "Área Legal" },
  nosotros_miembro3_rol:       { page: "nosotros", label: "Equipo — Miembro 3 Rol", multiline: false, value: "Asesoría Jurídica" },
  nosotros_miembro3_desc:      { page: "nosotros", label: "Equipo — Miembro 3 Descripción", multiline: false, value: "Respaldo legal completo en escrituraciones, contratos y trámites administrativos." },
  nosotros_membresias_eyebrow: { page: "nosotros", label: "Membresías — Etiqueta superior", multiline: false, value: "Somos miembros de" },
  nosotros_membresia1_nombre:  { page: "nosotros", label: "Membresías — Membresía 1 Nombre", multiline: false, value: "FIRA" },
  nosotros_membresia1_desc:    { page: "nosotros", label: "Membresías — Membresía 1 Descripción", multiline: false, value: "Federación Inmobiliaria de la República Argentina" },
  nosotros_membresia2_nombre:  { page: "nosotros", label: "Membresías — Membresía 2 Nombre", multiline: false, value: "CCI" },
  nosotros_membresia2_desc:    { page: "nosotros", label: "Membresías — Membresía 2 Descripción", multiline: false, value: "Cámara de Comercio e Industria de Santa Fe" },
  nosotros_membresia3_nombre:  { page: "nosotros", label: "Membresías — Membresía 3 Nombre", multiline: false, value: "CECI" },
  nosotros_membresia3_desc:    { page: "nosotros", label: "Membresías — Membresía 3 Descripción", multiline: false, value: "Centro de Corredores Inmobiliarios" },
  nosotros_contacto_eyebrow:   { page: "nosotros", label: "Contacto — Etiqueta superior", multiline: false, value: "Contacto" },
  nosotros_contacto_titulo:    { page: "nosotros", label: "Contacto — Título", multiline: false, value: "¿Hablamos?" },
  nosotros_contacto_texto:     { page: "nosotros", label: "Contacto — Texto", multiline: true, value: "Estamos disponibles de lunes a viernes para asesorarte en la compra, venta o alquiler de tu propiedad." },
  nosotros_contacto_email_cta: { page: "nosotros", label: "Contacto — CTA email", multiline: false, value: "Enviar email" },

  // FOOTER
  footer_tagline:       { page: "footer", label: "Tagline bajo el logo", multiline: false, value: "Más de 20 años de trayectoria en Santa Fe, garantizando seriedad, confianza y resultados reales." },
  footer_col2_titulo:   { page: "footer", label: "Columna 2 — Título", multiline: false, value: "¿Desea vender o alquilar?" },
  footer_col2_texto:    { page: "footer", label: "Columna 2 — Texto", multiline: true, value: "Contamos con un equipo altamente especializado y con amplio conocimiento del mercado inmobiliario capacitado para realizar una real y exacta tasación de su inmueble. Nuestro interés es brindarle el mejor servicio para su mejor beneficio." },
  footer_col2_cta:      { page: "footer", label: "Columna 2 — CTA", multiline: false, value: "Complete el formulario y a la brevedad lo contactaremos personalmente." },
  footer_cta_titulo:    { page: "footer", label: "Banda CTA — Título", multiline: false, value: "Hablemos hoy." },
  footer_cta_subtitulo: { page: "footer", label: "Banda CTA — Subtítulo", multiline: false, value: "¿Querés vender o alquilar?" },

  // EMAIL ALERTAS
  email_asunto:   { page: "email", label: "Asunto del email", multiline: false, value: "Nuevas propiedades que coinciden con tu búsqueda — Penalva Inmobiliaria" },
  email_saludo:   { page: "email", label: "Texto introductorio", multiline: false, value: "Ingresaron nuevas propiedades que coinciden con tu búsqueda:" },
  email_cierre:   { page: "email", label: "Texto de cierre", multiline: true, value: "Si tenés alguna consulta no dudes en contactarnos. Estamos para ayudarte." },

  // TASACIÓN
  tasacion_hero_titulo:      { page: "tasacion", label: "Hero — Título", multiline: false, value: "Tasación de Propiedades" },
  tasacion_hero_subtitulo:   { page: "tasacion", label: "Hero — Subtítulo", multiline: false, value: "Conocé el valor real de tu propiedad con un informe profesional respaldado por el mercado." },
  tasacion_hero_img:         { page: "tasacion", label: "Hero — Imagen", multiline: false, value: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80" },
  tasacion_hero_eyebrow:     { page: "tasacion", label: "Hero — Etiqueta superior", multiline: false, value: "Servicios" },
  tasacion_intro_titulo:     { page: "tasacion", label: "Intro — Título", multiline: false, value: "El valor real de su propiedad en Santa Fe." },
  tasacion_intro_eyebrow:    { page: "tasacion", label: "Intro — Etiqueta superior", multiline: false, value: "Tasación profesional" },
  tasacion_intro_p1:         { page: "tasacion", label: "Intro — Párrafo 1", multiline: true, value: "Sabemos que una propiedad es mucho más que metros cuadrados; es una inversión y, muchas veces, el esfuerzo de toda una vida. En nuestra inmobiliaria, combinamos nuestra amplia trayectoria en el sector con un análisis profundo de los indicadores económicos actuales de la ciudad." },
  tasacion_intro_p2:         { page: "tasacion", label: "Intro — Párrafo 2", multiline: true, value: "" },
  tasacion_intro_cta:        { page: "tasacion", label: "Intro — Llamada a la acción", multiline: false, value: "Solicite su entrevista." },
  tasacion_contacto_nota:    { page: "tasacion", label: "Intro — Nota de contacto", multiline: false, value: "Lo contactamos a la brevedad" },
  tasacion_incluye_titulo:   { page: "tasacion", label: "Incluye — Título del box", multiline: false, value: "¿Qué incluye la tasación?" },
  tasacion_incluye_1:        { page: "tasacion", label: "Incluye — Ítem 1", multiline: false, value: "Informes técnicos detallados" },
  tasacion_incluye_2:        { page: "tasacion", label: "Incluye — Ítem 2", multiline: false, value: "Análisis comparativo de mercado (ACM) actualizado" },
  tasacion_incluye_3:        { page: "tasacion", label: "Incluye — Ítem 3", multiline: false, value: "Asesoramiento basado en los índices de realidad local" },
  tasacion_incluye_nota:     { page: "tasacion", label: "Incluye — Nota al pie", multiline: false, value: "La tasación es gratuita y sin compromiso." },
  tasacion_tipos_titulo:     { page: "tasacion", label: "Tipos — Título", multiline: false, value: "Qué tipos de propiedades tasamos" },
  tasacion_tipos_eyebrow:    { page: "tasacion", label: "Tipos — Etiqueta superior", multiline: false, value: "Coberturas" },
  tasacion_tipo1_titulo:     { page: "tasacion", label: "Tipos — Tipo 1 Título", multiline: false, value: "Viviendas" },
  tasacion_tipo1_desc:       { page: "tasacion", label: "Tipos — Tipo 1 Descripción", multiline: false, value: "Casas, departamentos, dúplex y PH en toda la región de Santa Fe." },
  tasacion_tipo2_titulo:     { page: "tasacion", label: "Tipos — Tipo 2 Título", multiline: false, value: "Comerciales" },
  tasacion_tipo2_desc:       { page: "tasacion", label: "Tipos — Tipo 2 Descripción", multiline: false, value: "Locales, oficinas, depósitos y propiedades de uso mixto." },
  tasacion_tipo3_titulo:     { page: "tasacion", label: "Tipos — Tipo 3 Título", multiline: false, value: "Terrenos" },
  tasacion_tipo3_desc:       { page: "tasacion", label: "Tipos — Tipo 3 Descripción", multiline: false, value: "Lotes urbanos, suburbanos y rurales con análisis de potencial constructivo." },
  tasacion_tipo4_titulo:     { page: "tasacion", label: "Tipos — Tipo 4 Título", multiline: false, value: "Pericias judiciales" },
  tasacion_tipo4_desc:       { page: "tasacion", label: "Tipos — Tipo 4 Descripción", multiline: false, value: "Informes periciales para procesos sucesorios, divorcios o litigios." },
  tasacion_proceso_titulo:   { page: "tasacion", label: "Proceso — Título", multiline: false, value: "Cómo funciona" },
  tasacion_proceso_eyebrow:  { page: "tasacion", label: "Proceso — Etiqueta superior", multiline: false, value: "El proceso" },
  tasacion_paso1_titulo:     { page: "tasacion", label: "Proceso — Paso 1 Título", multiline: false, value: "Solicitá tu tasación" },
  tasacion_paso1_desc:       { page: "tasacion", label: "Proceso — Paso 1 Descripción", multiline: false, value: "Completá el formulario o comunicate con nosotros. Te contactamos en menos de 24 horas." },
  tasacion_paso2_titulo:     { page: "tasacion", label: "Proceso — Paso 2 Título", multiline: false, value: "Visita al inmueble" },
  tasacion_paso2_desc:       { page: "tasacion", label: "Proceso — Paso 2 Descripción", multiline: false, value: "Un profesional visita la propiedad para relevar sus características, estado y entorno." },
  tasacion_paso3_titulo:     { page: "tasacion", label: "Proceso — Paso 3 Título", multiline: false, value: "Análisis de mercado" },
  tasacion_paso3_desc:       { page: "tasacion", label: "Proceso — Paso 3 Descripción", multiline: false, value: "Comparamos con propiedades similares vendidas recientemente en la zona para determinar el valor real." },
  tasacion_paso4_titulo:     { page: "tasacion", label: "Proceso — Paso 4 Título", multiline: false, value: "Informe detallado" },
  tasacion_paso4_desc:       { page: "tasacion", label: "Proceso — Paso 4 Descripción", multiline: false, value: "Recibís un informe completo con la valoración y los fundamentos que la respaldan." },
  tasacion_form_titulo:      { page: "tasacion", label: "Formulario — Título", multiline: false, value: "Tasá tu propiedad\nsin costo" },
  tasacion_form_subtitulo:   { page: "tasacion", label: "Formulario — Subtítulo", multiline: true, value: "Completá el formulario y uno de nuestros asesores se pondrá en contacto con vos dentro de las próximas 24 horas." },
  tasacion_form_eyebrow:     { page: "tasacion", label: "Formulario — Etiqueta superior", multiline: false, value: "Solicitá ahora" },
  
  // ADMINISTRACIÓN DE CONSORCIOS
  consorcios_hero_titulo:    { page: "consorcios", label: "Hero — Título", multiline: false, value: "Administración de Consorcios" },
  consorcios_hero_subtitulo: { page: "consorcios", label: "Hero — Subtítulo", multiline: false, value: "Gestión integral, transparente y eficiente para su edificio o complejo." },
  consorcios_hero_img:       { page: "consorcios", label: "Hero — Imagen", multiline: false, value: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" },
  consorcios_intro_titulo:   { page: "consorcios", label: "Intro — Título", multiline: false, value: "Expertos en Gestión de Propiedades" },
  consorcios_intro_p1:       { page: "consorcios", label: "Intro — Párrafo 1", multiline: true, value: "Contamos con una amplia experiencia en la organización y liquidación de expensas, garantizando orden y claridad en las cuentas de su consorcio." },
  consorcios_intro_p2:       { page: "consorcios", label: "Intro — Párrafo 2", multiline: true, value: "Nuestro equipo se encarga de todo: mantenimiento, recursos humanos, seguimiento de moras y asesoramiento legal permanente." },

  // PROYECTO Y OBRA
  obras_hero_titulo:         { page: "obras", label: "Hero — Título", multiline: false, value: "Proyecto y Ejecución de Obras" },
  obras_hero_subtitulo:      { page: "obras", label: "Hero — Subtítulo", multiline: false, value: "Hacemos realidad sus proyectos, desde la concepción hasta la entrega de llaves." },
  obras_hero_img:            { page: "obras", label: "Hero — Imagen", multiline: false, value: "https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&w=1600&q=80" },
  obras_intro_titulo:        { page: "obras", label: "Intro — Título", multiline: false, value: "Construimos calidad" },
  obras_intro_p1:            { page: "obras", label: "Intro — Párrafo 1", multiline: true, value: "Brindamos un servicio integral de arquitectura y construcción, priorizando la funcionalidad, el diseño y el uso eficiente de recursos." },
  obras_intro_p2:            { page: "obras", label: "Intro — Párrafo 2", multiline: true, value: "Nos especializamos en desarrollos residenciales y comerciales, con un seguimiento riguroso de cada etapa de la obra." },
};

// Devuelve el valor de un bloque, tomando el default si no existe en la DB
export async function getContent(key: string, fallback?: string): Promise<string> {
  try {
    const block = await prisma.contentBlock.findUnique({ where: { key } });
    if (block) return block.value;
    return fallback ?? CONTENT_DEFAULTS[key]?.value ?? "";
  } catch {
    return fallback ?? CONTENT_DEFAULTS[key]?.value ?? "";
  }
}

// Devuelve múltiples bloques en una sola query (más eficiente para páginas con muchos bloques)
export async function getContentBatch(keys: string[]): Promise<Record<string, string>> {
  try {
    const blocks = await prisma.contentBlock.findMany({ where: { key: { in: keys } } });
    const map: Record<string, string> = {};
    blocks.forEach((b) => { map[b.key] = b.value; });
    return Object.fromEntries(keys.map((k) => [k, map[k] ?? CONTENT_DEFAULTS[k]?.value ?? ""]));
  } catch {
    return Object.fromEntries(keys.map((k) => [k, CONTENT_DEFAULTS[k]?.value ?? ""]));
  }
}

// Devuelve todos los bloques (para el panel admin)
export async function getAllContent(): Promise<Record<string, string>> {
  try {
    const blocks = await prisma.contentBlock.findMany();
    const map: Record<string, string> = {};
    blocks.forEach((b) => { map[b.key] = b.value; });
    return map;
  } catch {
    return {};
  }
}
