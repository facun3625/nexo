# Transformación inmobiliaria — primera entrega

## Base conservada

Se mantiene el proyecto raíz, PostgreSQL/Prisma 7, Auth.js, usuarios y roles, resolución de tenants por dominio, onboarding, suscripciones, revendedores, configuración, almacenamiento y deployment. No se importó código ni se modificaron archivos de `reference-real-estate`. Esa carpeta se excluyó de TypeScript y ESLint del proyecto principal.

## Implementado

- Dashboard administrativo con cartera, contactos, consultas nuevas, contratos activos, agenda y saldos vencidos por moneda.
- Administración en `/admin/gestion/[module]`: propiedades, contactos, consultas, visitas, operaciones, tasaciones, contratos, cobranzas, emprendimientos, mantenimiento, consorcios y unidades.
- Alta y edición con validación de servidor, control de tenant y auditoría de mutaciones administrativas.
- Propiedad física separada de sus ofertas de venta/alquiler; publicación, destacados, propietario principal, emprendimiento, características e imágenes.
- Catálogo público con búsqueda por ciudad/barrio/título, operación y dormitorios; paginación, ficha y consultas. La dirección exacta no se muestra públicamente.
- Contactos con varios roles, sin cuenta de acceso obligatoria.
- Visitas con comprobación de solapamientos por inmueble y nombre del agente, en horario de Argentina.
- Operaciones con negociación, reserva, cierre y pérdida. Reserva/cierre actualizan la disponibilidad de la oferta.
- Tasaciones con solicitante, inmueble, estado, valoración y notas.
- Registro de contratos con fechas, importe, moneda, notas de actualización y validación de contratos activos superpuestos.
- Obligaciones manuales de alquiler o expensas, cobros parciales confirmados, historial y anulación de obligaciones sin cobros.
- Protección contra sobrepagos y reenvíos duplicados mediante transacciones Serializable e identificadores de idempotencia.
- Consorcios y unidades con coeficientes; control de que su suma no exceda 100%.
- Límite de propiedades publicadas por plan, configurable desde plataforma.
- Claves foráneas compuestas impiden relaciones entre tenants en las tablas nuevas.

## Alcance que todavía falta

Esta entrega no completa toda la conversión del SaaS:

- Retirar definitivamente rutas, acciones y tablas ecommerce tras archivar el historial. Se reemplazaron la home del tenant, dashboard y navegación principal; las rutas antiguas todavía existen.
- Adaptar por completo marketing, onboarding, configuración, estadísticas históricas, demos anteriores y textos comerciales. No se convirtieron límites de productos/pedidos a límites inmobiliarios.
- Portal de propietarios/inquilinos y permisos específicos de agentes; hoy se mantienen los roles originales.
- Copropietarios, garantes y otros participantes de contratos; actualmente hay propietario principal y contacto del contrato.
- Documentos privados, plantillas, generación y firma de contratos.
- Generación automática de cuotas, actualización de alquileres y liquidaciones a propietarios.
- Gastos y liquidación/prorrateo integral de expensas. Hoy las obligaciones se cargan manualmente por unidad.
- Pagos online, conciliación, comprobantes pendientes y devoluciones. Los cobros actuales se registran manualmente cuando ya fueron recibidos; no existe un botón de pago activo.
- Un pago aplicado a varias obligaciones: hoy cada recibo se aplica a una obligación, que sí admite varios pagos parciales.
- Favoritos, comparador, mapas, alertas de búsquedas, notificaciones inmobiliarias por email/push y SEO/sitemap inmobiliario completo.
- Administración avanzada de galerías (borrado, reordenamiento), videos y planos; hoy se agregan fotografías.
- Auditoría con diferencias de valores y pantalla de consulta; hoy se registran actor, acción, entidad y fecha.
- Responsables vinculados a usuarios y zonas horarias configurables; los agentes de visitas/operaciones son nombres y la agenda usa UTC−3.

## Migraciones

Aplicadas en la base local:

1. `20260915160000_estate_foundation`
2. `20260915170000_estate_deals_valuations`

Son aditivas; no borran datos ecommerce ni cambian identificadores de autenticación/facturación. No se desplegó producción. El deployment existente puede aplicar estas migraciones con su flujo habitual, pero no conviene publicar esta entrega como conversión terminada hasta completar los pendientes indicados.

## Demo local

- Sitio: `http://demo-inmo.localhost:3010`
- Panel: `http://demo-inmo.localhost:3010/admin`
- Usuario: `admin@demo-inmo.example`
- Script: `node --import tsx scripts/seed-estate-demo.ts`

El script solo permite bases locales, no modifica una demo existente y genera una contraseña aleatoria al crearla. No almacena la contraseña en el repositorio. Los registros son ficticios y están clasificados como tenant DEMO. No se usan fotografías del proyecto de referencia.

Para iniciar en este entorno:

```sh
npm run dev -- --webpack
```

Se conserva el comando de deployment. Webpack se usa en las verificaciones locales porque Turbopack falla al intentar abrir un puerto interno en este entorno.

## Verificación

```sh
node --import tsx --test tests/estate-validation.test.ts
node --import tsx tests/estate-ledger.integration.ts
ESTATE_DEMO_PASSWORD='contraseña-generada' node --import tsx tests/estate-http.smoke.ts
npx tsc --noEmit --incremental false
npm run build -- --webpack
```

Las pruebas de integración crean fixtures dentro de transacciones y las revierten; no dejan datos de prueba. Verifican aislamiento, idempotencia, saldo parcial, sobrepago, auditoría y claves foráneas entre tenants. El smoke HTTP verifica autenticación, páginas administrativas, ficha pública, ausencia de dirección privada y 404. No sustituye una prueba visual/interactiva en navegador ni prueba end-to-end todos los formularios.
