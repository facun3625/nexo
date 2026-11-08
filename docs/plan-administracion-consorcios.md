# Plan de desarrollo — Administración de consorcios

## Alcance

Este documento propone la evolución del módulo de administración de consorcios de Urbi.

Es un plan técnico y funcional. No implica que las funcionalidades descriptas estén implementadas actualmente.

La propuesta conserva la arquitectura del SaaS, el aislamiento multi-tenant, la autenticación, las organizaciones, los usuarios, el almacenamiento, las notificaciones y la infraestructura existentes.

## Diagnóstico actual

Urbi ya dispone de una base inicial:

- Consorcios representados por `EstateBuilding`.
- Unidades con coeficiente y responsable.
- Obligaciones manuales asociadas a una unidad.
- Cobros parciales confirmados.
- Control de sobrepagos e idempotencia.
- Auditoría básica de mutaciones.
- Claves compuestas para impedir relaciones entre tenants.

Todavía no existe una administración integral de consorcios. Faltan principalmente:

- Gastos y proveedores.
- Liquidación y prorrateo de expensas.
- Cuenta corriente por unidad.
- Fondos y movimientos bancarios.
- Conciliación.
- Documentación respaldatoria.
- Morosidad y convenios.
- Asambleas.
- Portal para propietarios e inquilinos.
- Pagos online de expensas.

El proyecto `reference-real-estate` ofrece como referencia datos bancarios y una presentación pública del servicio, pero su modelo de consorcios es demasiado reducido para utilizarlo como base del backend de Urbi. No se debe importar su arquitectura ni su código.

## Criterio central

La administración de consorcios debe construirse alrededor de una **cuenta corriente contable por consorcio y unidad**.

```text
Gastos y saldos anteriores
        ↓
Liquidación en borrador
        ↓
Prorrateo por coeficientes
        ↓
Revisión y cierre
        ↓
Expensas por unidad
        ↓
Cobros e imputaciones
        ↓
Conciliación y rendición
```

Una liquidación publicada debe quedar congelada. Las correcciones posteriores deben registrarse mediante ajustes, reversos o notas de crédito, manteniendo el historial.

## Modelo de datos propuesto

### 1. Consorcio

Ampliar el modelo actual con:

- Nombre legal y nombre comercial.
- CUIT.
- Dirección completa.
- Jurisdicción.
- Fecha de cierre del ejercicio.
- Datos y matrícula del administrador.
- Reglamento de propiedad horizontal.
- Consejo de propietarios.
- Datos fiscales.
- Bancos y cuentas.
- Seguros y vencimientos.
- Estado activo o archivado.

La jurisdicción debe formar parte de la configuración porque los requisitos pueden variar entre CABA, Córdoba y otras provincias.

### 2. Unidades y participantes

Reemplazar el campo libre `responsibleName` por relaciones formales:

- Unidad funcional.
- Unidad complementaria.
- Piso, departamento y nomenclatura.
- Superficie.
- Propietarios actuales e históricos.
- Inquilinos y ocupantes.
- Porcentaje de titularidad.
- Domicilio electrónico.
- Fecha de inicio y finalización de cada relación.
- Preferencia de recepción digital o en papel.

Una unidad puede tener varios propietarios y un ocupante diferente del titular.

### 3. Coeficientes

No utilizar un único coeficiente para todos los gastos.

Crear:

- Tipo de coeficiente.
- Coeficiente general.
- Coeficientes por torre, cochera, ascensor u otros grupos.
- Vigencia histórica.
- Exenciones y reglas especiales.
- Validación de totales.

Esto permite distribuir determinados gastos solamente entre las unidades alcanzadas.

### 4. Proveedores y comprobantes

- Proveedor.
- CUIT y condición fiscal.
- Rubro.
- Datos bancarios.
- Seguros y documentación.
- Facturas y comprobantes.
- Retenciones.
- Contratos o abonos recurrentes.
- Vencimientos.
- Estado del pago.

Los comprobantes deben utilizar el sistema de almacenamiento existente de Urbi.

### 5. Gastos

Cada gasto debe registrar:

- Consorcio y período.
- Proveedor.
- Categoría.
- Descripción.
- Importe y moneda.
- Clasificación ordinaria o extraordinaria.
- Fecha del comprobante y vencimiento.
- Archivo respaldatorio.
- Grupo de unidades alcanzadas.
- Coeficiente aplicable.
- Fondo desde el cual se paga.
- Estado: borrador, aprobado, pagado o anulado.

Los gastos recurrentes deben generarse como borradores sujetos a revisión.

### 6. Liquidaciones

Modelos conceptuales sugeridos:

- `ConsortiumSettlement`
- `SettlementExpense`
- `UnitAssessment`
- `AssessmentLine`
- `SettlementAdjustment`

Estados de una liquidación:

1. Borrador.
2. Calculada.
3. En revisión.
4. Aprobada.
5. Publicada.
6. Rectificada.

Contenido mínimo previsto:

- Saldo anterior.
- Pagos recibidos.
- Intereses.
- Gastos del período.
- Expensas ordinarias.
- Expensas extraordinarias.
- Fondo de reserva.
- Ajustes.
- Total por unidad.
- Primer y segundo vencimiento.
- Estado de caja.
- Resumen bancario.
- Estado patrimonial.
- Nómina de deudores cuando corresponda.

El formato debe ser configurable por jurisdicción.

### 7. Cuenta corriente

Cada unidad debe tener un libro de movimientos compuesto por:

- Expensa.
- Pago.
- Interés.
- Ajuste.
- Nota de crédito.
- Convenio.
- Saldo inicial.
- Reversión.

El saldo no debe guardarse como una cifra aislada. Debe calcularse a partir de movimientos auditables.

### 8. Cobranzas

Evolucionar el sistema actual para admitir:

- Un pago aplicado a varias obligaciones.
- Pagos parciales.
- Pagos anticipados.
- Saldos a favor.
- Imputación automática o manual.
- Reversión controlada.
- Recibos numerados.
- Comprobantes adjuntos.
- Método y referencia bancaria.
- Usuario que registró la operación.

### 9. Morosidad

- Interés configurable por consorcio.
- Fecha desde la que se calcula.
- Interés simple o compuesto según configuración.
- Segundo vencimiento.
- Convenios de pago.
- Seguimiento prejudicial y judicial.
- Historial de notificaciones.
- Certificado de deuda.

Los certificados deben generarse desde movimientos cerrados y conservar una copia inmutable de la información utilizada.

### 10. Bancos y conciliación

- Varias cuentas bancarias por consorcio.
- Importación de movimientos.
- Registro de ingresos y egresos.
- Conciliación con pagos y gastos.
- Transferencias entre fondos.
- Movimientos sin identificar.
- Cierre bancario mensual.
- Resumen bancario para la liquidación.

## Pagos online de expensas

Los pagos online deben implementarse después de consolidar la cuenta corriente y el motor de liquidación.

Alcance propuesto:

- Link o QR de pago por unidad.
- Mercado Pago u otro proveedor configurable.
- Transferencia bancaria.
- Carga de comprobantes.
- Webhooks firmados.
- Idempotencia.
- Conciliación automática.
- Comisiones separadas del importe de expensas.
- Devoluciones y contracargos.
- Recibo automático.
- Distribución por consorcio.

Los fondos y operaciones de expensas deben quedar separados de:

- La suscripción mensual de Urbi.
- Los pagos heredados del ecommerce.
- Los fondos de otros consorcios.
- Las cuentas propias de la inmobiliaria.

## Mantenimiento y reclamos

Relacionar mantenimiento directamente con consorcios y unidades:

- Reclamo.
- Unidad o espacio común afectado.
- Categoría.
- Prioridad.
- Fotografías y documentos.
- Proveedor asignado.
- Presupuestos.
- Aprobación.
- Orden de trabajo.
- Visita programada.
- Gastos derivados.
- Seguimiento y cierre.
- Comunicación al denunciante.

Un trabajo aprobado debe poder convertirse en gasto de una liquidación sin volver a cargar los datos.

## Asambleas

- Convocatoria.
- Orden del día.
- Documentos adjuntos.
- Propietarios habilitados.
- Poderes.
- Presentes y quórum.
- Votaciones.
- Mayoría requerida.
- Resultado.
- Acta.
- Decisiones y tareas derivadas.
- Firma o conformidad.
- Historial de comunicaciones.

## Portal para propietarios e inquilinos

Después del núcleo contable:

- Estado de cuenta.
- Liquidaciones.
- Recibos.
- Comprobantes respaldatorios.
- Reglamento.
- Actas.
- Comunicaciones.
- Reclamos.
- Reservas de espacios comunes.
- Pago online.
- Actualización de datos.
- Preferencias de notificación.

Cada persona debe acceder únicamente a las unidades con las que mantenga una relación vigente.

## Roles y permisos

Roles adicionales propuestos:

- Administrador de consorcios.
- Liquidador o contador.
- Operador de cobranzas.
- Responsable de mantenimiento.
- Miembro del consejo.
- Propietario.
- Inquilino u ocupante.
- Proveedor con acceso limitado.

Los permisos deben poder limitarse por consorcio. Un empleado podría administrar determinados edificios sin acceder al resto de la cartera del tenant.

## Seguridad y auditoría

- Mantener `tenantId` en todas las entidades.
- Usar claves foráneas compuestas para evitar relaciones entre tenants.
- Autorizar cada operación además por consorcio.
- Registrar actor, fecha, entidad, operación y diferencias de valores.
- Conservar versiones de liquidaciones y documentos publicados.
- Registrar accesos a documentación sensible.
- Proteger CUIT, domicilios, situación de deuda y datos de contacto.
- Definir políticas de conservación y eliminación de archivos.
- Separar secretos y credenciales por integración.

## Plan por etapas

### Etapa 0 — Definición funcional y migración

- Definir jurisdicciones iniciales.
- Relevar liquidaciones reales y reglas de prorrateo.
- Diseñar migración desde `EstateBuilding`, `EstateUnit`, `EstateCharge` y `EstateReceipt`.
- Definir qué movimientos existentes se convierten y cuáles quedan como historial.
- Preparar importadores desde Excel o CSV.

### Etapa 1 — Base administrativa

- Ampliar consorcios y unidades.
- Incorporar propietarios, inquilinos y vigencias.
- Implementar coeficientes múltiples.
- Registrar cuentas bancarias.
- Incorporar proveedores y documentos.

**Resultado:** padrón confiable sobre el cual liquidar.

### Etapa 2 — Gastos y fondos

- Categorías.
- Facturas.
- Gastos recurrentes.
- Caja y bancos.
- Fondo ordinario, extraordinario y de reserva.
- Presupuestos.
- Pagos a proveedores.

**Resultado:** gastos documentados y listos para incluir en una liquidación.

### Etapa 3 — Motor de liquidación

- Períodos.
- Prorrateo por coeficiente.
- Ordinarias y extraordinarias.
- Saldos anteriores.
- Intereses.
- Vista previa.
- Control de diferencias.
- Aprobación y cierre.
- PDF y envío.

**Resultado:** primera versión operativa y comercialmente útil del módulo.

### Etapa 4 — Cuenta corriente y cobranzas

- Movimientos inmutables.
- Imputación de pagos.
- Pagos parciales y múltiples.
- Recibos.
- Morosidad.
- Convenios.
- Certificados de deuda.
- Conciliación bancaria.

**Resultado:** seguimiento completo de deuda y recaudación.

### Etapa 5 — Portal del consorcista

- Acceso por unidad.
- Liquidaciones y recibos.
- Documentación.
- Reclamos.
- Comunicaciones.
- Preferencias de envío.

### Etapa 6 — Mantenimiento

- Reclamos.
- Presupuestos.
- Órdenes de trabajo.
- Proveedores.
- Gastos vinculados.
- Historial del edificio.

### Etapa 7 — Asambleas y cumplimiento

- Convocatorias.
- Poderes y asistencia.
- Votaciones.
- Actas.
- Rendición documentada.
- Seguros, inspecciones y vencimientos.
- Reglas y documentos por jurisdicción.

### Etapa 8 — Pagos online

- Checkout de expensas.
- Transferencias y comprobantes.
- Webhooks.
- Conciliación automática.
- Contracargos.
- Recibos automáticos.

### Etapa 9 — Informes e integraciones

- Estado patrimonial.
- Flujo de fondos.
- Deudores.
- Gastos por rubro.
- Ejecución presupuestaria.
- Exportación contable.
- Exportaciones para ARCA.
- Informes para el consejo y los propietarios.

## Orden recomendado

1. Consorcios, unidades, propietarios y coeficientes.
2. Proveedores, gastos y documentos.
3. Liquidación mensual en borrador.
4. Prorrateo y cierre inmutable.
5. Cuenta corriente y cobranzas.
6. PDF y envío.
7. Portal.
8. Pago online.
9. Mantenimiento y asambleas avanzadas.

No se recomienda comenzar por pagos online o por el portal. Sin una liquidación y una cuenta corriente confiables, ambos mostrarían información incompleta y obligarían a reconstruir posteriormente el núcleo contable.

## Criterios de aceptación

Antes de avanzar de una etapa a la siguiente deben verificarse:

- Aislamiento entre tenants.
- Aislamiento de permisos entre consorcios.
- Cálculos reproducibles con redondeos definidos.
- Suma de prorrateos igual al total liquidado.
- Operaciones financieras transaccionales e idempotentes.
- Liquidaciones publicadas inmutables.
- Reversiones auditables.
- Documentación vinculada a cada gasto.
- Exportación de información sin depender de la interfaz.
- Pruebas con casos reales anonimizados.

## Referencias normativas consultadas

- [Código Civil y Comercial — propiedad horizontal y obligaciones del administrador](https://biblioteca.arca.gob.ar/pdfp/CCCN_ley27799.pdf)
- [Propiedad horizontal — Derecho Fácil](https://www.argentina.gob.ar/justicia/derechofacil/leysimple/propiedad-horizontal)
- [Ley 941 de CABA — Registro Público de Administradores](https://boletinoficial.buenosaires.gob.ar/normativaba/norma/29885)
- [Modelo Único de Liquidación y Recibo de Expensas de CABA](https://www.boletinoficial.buenosaires.gob.ar/normativaba/norma/243213)
- [Marco legal del Registro Público de Administradores de CABA](https://buenosaires.gob.ar/gcaba_historico/registro-publico-de-administradores-de-consorcios/marco-legal)
- [Régimen informativo de pago de expensas — ARCA](https://arca.gob.ar/aplicativos/oProgramasImpositivos/pagoExpensas.asp)
- [Ley 25.326 de Protección de Datos Personales](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion)
- [Decreto 487/2025 sobre individualización y rúbrica de libros](https://www.argentina.gob.ar/normativa/nacional/decreto-487-2025-415381)

## Nota legal

El sistema debe permitir configuración por jurisdicción y revisión profesional de plantillas, liquidaciones, certificados y procesos. Este documento orienta el diseño del producto; no sustituye asesoramiento jurídico, contable o laboral.
