# Arquitectura inicial de la plataforma SaaS inmobiliaria

**Estado:** Documento base de definición  
**Versión:** 0.1  
**Objetivo:** Establecer la arquitectura conceptual inicial de una plataforma SaaS compuesta por tres módulos independientes: Inmobiliaria, Consorcios y Posventa.

---

## 1. Visión general

La plataforma será un SaaS multiempresa orientado a inmobiliarias, administradores de consorcios, desarrolladores y constructoras.

El producto estará compuesto por tres módulos principales:

1. **Inmobiliaria**
2. **Consorcios**
3. **Posventa de desarrollos inmobiliarios**

Los módulos compartirán una misma plataforma tecnológica y una misma cuenta empresarial, pero deberán poder contratarse, configurarse, utilizarse y administrarse de manera independiente.

Una empresa podrá contratar uno, dos o los tres módulos. Al ingresar, sus usuarios verán únicamente los módulos y funciones que tengan habilitados.

La premisa principal es:

> Compartir la infraestructura general de la plataforma sin mezclar la operación ni la información interna de cada módulo.

---

## 2. Principios de arquitectura acordados

### 2.1. Una empresa representa un tenant

Cada organización será un **tenant** independiente dentro de la plataforma.

Ejemplos:

- Una inmobiliaria tradicional.
- Una empresa administradora de consorcios.
- Una constructora o desarrolladora.
- Una organización que realiza las tres actividades.

Cada tenant tendrá sus propios:

- Datos empresariales.
- Marca y configuración visual.
- Sucursales, si correspondiera.
- Usuarios internos.
- Roles y permisos.
- Suscripción y facturación.
- Módulos habilitados.
- Límites de uso.
- Archivos e historial de auditoría.

La información de un tenant nunca deberá quedar disponible para otro tenant.

### 2.2. Una cuenta empresarial, varios módulos

Una misma empresa podrá contratar cualquier combinación de módulos.

Ejemplos:

- Solamente Inmobiliaria.
- Solamente Consorcios.
- Solamente Posventa.
- Inmobiliaria y Consorcios.
- Inmobiliaria y Posventa.
- Consorcios y Posventa.
- Los tres módulos.

Los usuarios ingresarán con una única cuenta. Si tienen acceso a más de un módulo, podrán cambiar entre ellos mediante un selector general.

### 2.3. Los módulos son independientes

Cada módulo funcionará como un dominio operativo separado, con:

- Menú propio.
- Tablero propio.
- Listas propias.
- Procesos propios.
- Estados propios.
- Roles y permisos específicos.
- Documentos e historiales propios.
- Configuración particular.

Una empresa que solamente contrate Posventa no deberá ver pantallas, campos ni conceptos correspondientes a Inmobiliaria o Consorcios.

La independencia debe existir tanto en la experiencia del usuario como en la organización interna del software.

---

## 3. Alcance conceptual de cada módulo

### 3.1. Módulo Inmobiliaria

Este módulo administra la actividad comercial y contractual de una inmobiliaria.

Entidades y funciones principales previstas:

- Propiedades.
- Propietarios.
- Inquilinos.
- Compradores e interesados.
- Consultas y oportunidades comerciales.
- Agenda de visitas.
- Operaciones de venta y alquiler.
- Reservas.
- Contratos.
- Pagos y vencimientos.
- Documentación.
- Publicación en el sitio web y portales externos.
- CRM y seguimiento comercial.

Este módulo ya constituye la primera base funcional del producto.

### 3.2. Módulo Consorcios

Este módulo administra edificios, unidades funcionales, consorcistas y la operación cotidiana de los consorcios.

Entidades y funciones generales previstas:

- Consorcios.
- Edificios.
- Unidades funcionales.
- Propietarios y ocupantes.
- Expensas.
- Pagos y saldos.
- Gastos.
- Proveedores.
- Reclamos y comunicaciones.
- Documentación.
- Asambleas y novedades.

Su definición funcional detallada se desarrollará en una etapa específica.

### 3.3. Módulo Posventa

Este módulo estará destinado a desarrolladores y constructoras que deban gestionar la relación con los compradores luego de la entrega o posesión de una unidad.

Entidades y funciones generales previstas:

- Desarrollos inmobiliarios.
- Etapas, torres o sectores.
- Unidades.
- Compradores o titulares.
- Actas de entrega.
- Garantías.
- Reclamos posventa.
- Inspecciones.
- Visitas técnicas.
- Órdenes de trabajo.
- Contratistas y responsables.
- Reparaciones.
- Evidencias fotográficas y documentación.
- Comunicaciones con el comprador.
- Conformidad y cierre de casos.
- Indicadores de cumplimiento y tiempos de resolución.

Este será el próximo módulo que se definirá funcionalmente en profundidad.

---

## 4. Núcleo compartido de la plataforma

Los módulos no serán tres aplicaciones completamente desconectadas. Compartirán un núcleo común que resolverá las necesidades generales del SaaS.

El núcleo compartido incluirá:

- Empresas o tenants.
- Sucursales.
- Usuarios.
- Autenticación y recuperación de acceso.
- Roles y permisos.
- Suscripciones.
- Planes comerciales.
- Funciones habilitadas.
- Límites de consumo.
- Facturación de la plataforma.
- Almacenamiento de archivos.
- Notificaciones.
- Plantillas de correo y mensajes.
- Registro de actividad y auditoría.
- Preferencias generales.
- Marca, logotipo, colores y datos institucionales.

Este núcleo permitirá evitar la duplicación de funciones comunes, manteniendo separados los procesos particulares de cada módulo.

---

## 5. Personas y contactos

### 5.1. Identidad central, operación separada

Una misma persona puede participar en más de un módulo.

Ejemplo:

- En Inmobiliaria, Juan Pérez puede ser un comprador.
- En Posventa, puede ser titular de una unidad entregada.
- En Consorcios, puede ser consorcista de esa misma unidad.

La plataforma podrá mantener una identidad central mínima para evitar duplicaciones innecesarias, utilizando datos como:

- Nombre y apellido o razón social.
- DNI, CUIT o identificador equivalente.
- Correo electrónico.
- Teléfono.

Sin embargo, cada módulo tendrá su propia ficha operativa vinculada a esa identidad.

La ficha específica de cada módulo conservará de forma independiente:

- Rol de la persona dentro del módulo.
- Estado.
- Observaciones.
- Documentos.
- Historial.
- Comunicaciones.
- Relaciones con propiedades, unidades, contratos o reclamos.
- Información privada del módulo.

### 5.2. Las listas permanecen separadas

Que una persona exista en un módulo no implica que deba aparecer automáticamente en otro.

Cada módulo mostrará sus propias listas de clientes, titulares, propietarios, inquilinos, consorcistas o compradores.

Cuando el sistema detecte una posible coincidencia por DNI, CUIT, correo o teléfono, podrá sugerir una vinculación:

> Esta persona ya está registrada en otro módulo. ¿Desea vincularla?

La vinculación no deberá mezclar automáticamente observaciones, documentos, historiales ni permisos.

---

## 6. Propiedades, edificios, desarrollos y unidades

Los tres módulos trabajan con bienes físicos relacionados, pero no necesariamente con el mismo significado operativo.

- Inmobiliaria trabaja con **propiedades publicadas, administradas, vendidas o alquiladas**.
- Consorcios trabaja con **edificios, consorcios y unidades funcionales**.
- Posventa trabaja con **desarrollos, etapas y unidades entregadas**.

Por este motivo, no se deberá utilizar una única entidad rígida para resolver todas las necesidades.

Cada módulo tendrá sus propias entidades operativas. Cuando corresponda, podrán vincularse de manera explícita.

Ejemplo de continuidad:

1. Una unidad se crea dentro de un desarrollo en Posventa.
2. Esa unidad puede vincularse con una propiedad comercializada en Inmobiliaria.
3. Luego puede vincularse con una unidad funcional administrada en Consorcios.

La vinculación permitirá navegar entre los módulos autorizados sin fusionar sus procesos internos.

---

## 7. Planes, módulos, funciones y límites

### 7.1. Separación entre producto y plan comercial

Los planes comerciales no definirán la estructura técnica del sistema.

Un plan será una configuración que determine:

1. Qué módulos están habilitados.
2. Qué funciones están habilitadas dentro de cada módulo.
3. Qué límites de utilización corresponden.

Esto permitirá crear, modificar o retirar planes sin reconstruir el producto.

### 7.2. Ejemplos iniciales de planes

| Plan | Módulos | Ejemplo de alcance |
|---|---|---|
| Inmobiliaria Simple | Inmobiliaria | Propiedades, consultas y sitio público |
| Inmobiliaria Completa | Inmobiliaria | CRM, contratos, pagos, portales y funciones avanzadas |
| Consorcios | Consorcios | Administración de consorcios y unidades según límites |
| Posventa | Posventa | Desarrollos, entregas, garantías y reclamos |
| Inmobiliaria + Posventa | Inmobiliaria y Posventa | Comercialización y seguimiento posterior a la entrega |
| Integral | Los tres módulos | Acceso completo sujeto a funciones y límites contratados |

Estos nombres son ilustrativos. La plataforma deberá permitir definir muchos planes y combinaciones comerciales.

### 7.3. Funciones habilitables

Cada capacidad relevante deberá poder habilitarse mediante permisos funcionales o *feature flags*.

Ejemplos conceptuales:

- `real_estate.properties`
- `real_estate.contracts`
- `real_estate.portal_integrations`
- `consortium.expenses`
- `consortium.claims`
- `post_sale.warranties`
- `post_sale.work_orders`
- `post_sale.analytics`

### 7.4. Límites configurables

Además de habilitar funciones, los planes podrán establecer límites como:

- Cantidad de usuarios.
- Cantidad de propiedades activas.
- Cantidad de consorcios.
- Cantidad de unidades funcionales.
- Cantidad de desarrollos.
- Cantidad de unidades entregadas.
- Espacio de almacenamiento.
- Volumen de notificaciones o comunicaciones.
- Integraciones externas disponibles.

---

## 8. Usuarios, roles y permisos

Los usuarios pertenecen al tenant y pueden tener acceso a uno o varios módulos.

Ejemplo:

- Un agente comercial accede solamente a Inmobiliaria.
- Un administrador accede solamente a Consorcios.
- Un responsable técnico accede solamente a Posventa.
- El dueño o gerente accede a los tres módulos.
- Un contratista externo accede únicamente a las órdenes de trabajo que le fueron asignadas.

Los permisos deberán resolverse en varios niveles:

1. Acceso al tenant.
2. Acceso al módulo.
3. Acceso a una función.
4. Alcance sobre determinados registros.
5. Acciones permitidas: ver, crear, editar, asignar, aprobar, cerrar, eliminar o exportar.

La contratación de un módulo por parte de la empresa no otorgará acceso automático a todos sus usuarios.

---

## 9. Experiencia de navegación

### 9.1. Acceso

El usuario iniciará sesión una única vez.

Después del ingreso:

- Si tiene acceso a un solo módulo, podrá entrar directamente a ese módulo.
- Si tiene acceso a varios módulos, verá un selector o lanzador de módulos.
- Dentro de cada módulo tendrá un menú y tablero específicos.
- Podrá cambiar de módulo sin volver a iniciar sesión.

### 9.2. Aislamiento visual

Cada módulo deberá sentirse completo y autónomo.

No se mostrarán:

- Opciones de módulos no contratados.
- Datos de otros módulos sin autorización.
- Campos irrelevantes para la tarea actual.
- Acciones bloqueadas que generen confusión, salvo que exista una decisión comercial expresa para mostrarlas como mejora disponible.

---

## 10. Enfoque técnico recomendado

Se recomienda comenzar con un **monolito modular multi-tenant**, manteniendo límites claros entre dominios.

Esto permite:

- Compartir autenticación, infraestructura y despliegue.
- Desarrollar con mayor velocidad inicial.
- Evitar la complejidad prematura de microservicios.
- Mantener cada módulo organizado y desacoplado.
- Separar servicios en el futuro si el volumen o el negocio lo justifican.

Cada módulo deberá contar con:

- Su propio espacio de código.
- Sus propios servicios y reglas de negocio.
- Sus propias tablas o esquemas lógicos.
- Sus propias rutas y pantallas.
- Sus propios permisos.
- APIs internas bien delimitadas para comunicarse con otros módulos.

Ningún módulo debería modificar directamente información interna de otro. Las vinculaciones o transferencias deberán realizarse mediante servicios definidos.

---

## 11. Reglas que no deberían romperse

1. Todo registro operativo debe pertenecer a un tenant.
2. Ningún usuario debe acceder a un módulo sin autorización explícita.
3. Los planes comerciales habilitan capacidades; no deben controlar directamente toda la lógica del producto mediante condiciones rígidas.
4. Las listas operativas de personas permanecerán separadas por módulo.
5. Una identidad compartida no implica compartir observaciones, documentos o historiales.
6. Las entidades físicas relacionadas podrán vincularse, pero no fusionarse automáticamente.
7. Cada módulo debe poder utilizarse y venderse por separado.
8. El sistema debe permitir incorporar nuevos planes sin modificar su arquitectura central.
9. Las acciones relevantes deben quedar registradas en auditoría.
10. La independencia funcional de los módulos debe mantenerse aunque compartan una misma base tecnológica.

---

## 12. Decisiones confirmadas

- La plataforma tendrá tres módulos: Inmobiliaria, Consorcios y Posventa.
- Los módulos podrán contratarse individualmente o en cualquier combinación.
- Existirá una única cuenta empresarial.
- Los usuarios podrán cambiar de módulo mediante un selector.
- Cada módulo tendrá listas, procesos, fichas e historiales propios.
- Las personas podrán vincularse entre módulos, pero no se mezclarán automáticamente.
- Los usuarios tendrán permisos independientes por módulo.
- Los planes comerciales serán combinaciones configurables de módulos, funciones y límites.
- Se priorizará un monolito modular multi-tenant con límites de dominio claros.
- El próximo trabajo de definición se concentrará en el módulo Posventa.

---

## 13. Próxima etapa: definición del módulo Posventa

La siguiente etapa deberá resolver, en orden:

1. Qué empresas utilizarán el módulo.
2. En qué momento comienza la posventa.
3. Cómo se estructura un desarrollo, sus etapas y unidades.
4. Cómo se registra al comprador o titular.
5. Cómo se realiza la entrega de una unidad.
6. Cómo se informan y clasifican reclamos.
7. Cómo funcionan las garantías.
8. Cómo se asignan inspecciones y órdenes de trabajo.
9. Cómo participan empleados, compradores, técnicos y contratistas.
10. Cómo se documenta la solución y se obtiene conformidad.
11. Qué comunicaciones y notificaciones se necesitan.
12. Qué indicadores debe ver la desarrolladora.
13. Qué información puede transferirse luego al módulo Consorcios.

Este documento servirá como marco para tomar esas decisiones sin perder la separación entre los tres dominios.
