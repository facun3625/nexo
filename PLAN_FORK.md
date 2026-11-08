# Fork para Gerreli: app inmobiliaria standalone (sin multi-tenant)

## Contexto

`app_inmo` (Urbi) es un SaaS multi-tenant: una sola app Next.js sirve
infinitas inmobiliarias distintas, cada una resuelta por subdominio o
dominio propio en cada request, con un panel `/platform` para administrar
tiendas/planes/facturación, un flujo de alta (`/registro`) para que
cualquiera cree su propia tienda, y módulos de e-commerce (pedidos,
carrito, checkout, productos), Postventa y Consorcios además del core
inmobiliario.

Gerreli (gerellicorrenti.com.ar) es **un cliente puntual, no un SaaS**:
necesita su propia app, sin ningún rastro de multi-tenancy, sin el panel
de plataforma, sin flujo de alta de nuevas tiendas, y sin los módulos que
no pidió (Postventa, Consorcios, Servicios, e-commerce, Agente IA). El
pedido explícito fue un **fork real**: código propio en
`/Users/facundoarteagasola/Documents/Apps/Gerreli app`, no un tenant más
dentro de Urbi — aceptando que no comparte mejoras futuras de la
plataforma y que es más trabajo que crear un tenant.

Ya existe un tenant de referencia en la base local (`demo-inmo`, id
`cmu35c3ty0000tl3mk0ku9171`) con marca, colores, logo, foto de portada y 8
propiedades cargadas — el usuario pidió que el fork se vea **"exactamente
igual a esta, el front y el admin"**. Ese tenant es el punto de partida
visual/de contenido (no el código: el código sigue siendo el de Urbi,
simplificado).

## Qué se mantiene (core inmobiliario)

- **Público**: `propiedades`, `emprendimientos`, `mapa`, `alertas`,
  `favoritos`, `mi-alquiler` (portal del inquilino), `contacto`,
  `sobre-nosotros`, `agente` (vista de agente con permisos), login/registro
  de clientes (`login`, `entrar`, `recuperar-contrasena`,
  `restablecer-contrasena`), `perfil`, `preguntas-frecuentes` (recontenido),
  `privacidad`/`terminos` (recontenido).
- **Admin** (`src/app/admin/`): `gestion/*` completo (propiedades,
  clientes, agentes, contratos, cobranzas, emprendimientos,
  consultas-emprendimientos, categorías, y el resto de secciones que
  cuelgan de la ruta dinámica `gestion/[module]`: consultas, búsquedas,
  visitas, operaciones, tasaciones), `estadisticas`, `pagina` (editor del
  sitio: identidad, home, footer, social, filtros de catálogo),
  `usuarios`, `configuracion` recortado (sin dominio propio/verificación,
  sin agente IA — quedan Telegram, SEO, popup, email), `layout.tsx` y
  `page.tsx` del shell admin.
- **Lib/infra reusada tal cual**: `src/lib/settings.ts` (branding),
  `src/lib/storage.ts` (R2), `src/lib/email-templates.ts` (sin los campos
  de pedidos que ya sacamos), `src/lib/rate-limit.ts`, `src/lib/telegram.ts`,
  Prisma (motor, no el modelo completo — ver abajo).

## Qué se saca por completo

- **Multi-tenancy end a end**: `src/proxy.ts` (resolución de tenant por
  host) se reemplaza por un proxy mínimo (solo pathname/auth, sin
  subdominios); `src/lib/tenant.ts` (`getCurrentTenant`) se reemplaza por
  una constante/lookup fijo a la única fila `Tenant`; `src/auth.ts` /
  `src/auth.config.ts` / `src/lib/auth-adapter.ts` pierden toda la lógica
  de adapter tenant-aware, `redirectProxyUrl`, y el salto de dominio del
  onboarding (quedan simples: un solo dominio, Google + credentials
  normales).
- **Panel de plataforma**: toda `src/app/platform/` (tiendas, planes,
  facturación, dominios, revendedores, promociones, backups, tráfico,
  chats, usuarios de plataforma, demo).
- **Alta de tiendas y cuenta central**: `src/app/registro/`,
  `src/app/mi-cuenta/` (incluye `tienda/plan`, `join-reseller-button`),
  `src/app/cambiar-plan/`, `src/app/revendedores/`, `src/app/socios/`,
  `src/app/demo/`, `src/app/admin/cuenta-urbi/` (impersonación desde
  plataforma).
- **E-commerce (pedidos)**: `src/app/carrito/`, `src/app/checkout/`,
  `src/app/pedidos/`, `src/app/admin/pedidos/`, `src/app/admin/productos/`,
  `src/app/admin/pagos/` (Mercado Pago por tienda), `src/app/admin/entrega/`,
  `src/app/admin/fechas/`, y en `admin/configuracion/`:
  `email-editor.tsx`/`email-log-table.tsx` (plantilla de confirmación de
  pedido) y `documentacion-tab.tsx` (documenta flujos que ya no existen).
- **Postventa / Consorcios / Servicios** (no pedidos): `src/app/posventa/`,
  `src/app/mi-propiedad/`, `src/app/admin/postventa/`,
  `src/app/admin/consorcios/`, `src/app/proveedor/`, `src/app/servicios/`,
  `src/app/admin/servicios/`, `src/app/admin/consultas/` (consultas de
  Servicios, no confundir con las de `gestion/[module]`).
- **Agente de ventas IA**: `src/components/estate/ai-agent-widget.tsx`,
  `src/lib/sales-bot.ts`, rutas `/api/sales-bot*`, `/api/estate-ai`,
  `admin/configuracion/ai-agent-settings-form.tsx`.
- **Billing de plataforma**: crons `/api/cron/billing`, webhooks
  `/api/webhooks/mercadopago/subscriptions`, `src/lib/platform-billing.ts`,
  `src/lib/mercadopago*.ts` (si no queda nada que lo use tras sacar pedidos
  y planes).
- **Dominio propio verificado por DNS**: innecesario con un solo dominio
  fijo — se saca `custom-domain-form.tsx`, `domain-request-form.tsx`,
  `src/lib/custom-domain.ts`, campos `customDomain*` del modelo `Tenant`.

## Modelo de datos (Prisma)

Se parte del mismo `schema.prisma` y se recorta a lo que el core
inmobiliario usa: se borran los modelos exclusivos de e-commerce (`Order`,
`OrderItem`, `Product*`, `DeliveryDate`, `PickupSlot`,
`PaymentMethodConfig`, `FulfillmentMethodConfig`, `StockGroup*`,
`PaymentProof`, etc.), de Postventa/Consorcios, de plataforma (`Plan`,
`PromotionCode`, `ResellerCommission`, `ResellerSettings`, backups), y los
campos de `Tenant`/`User` que solo tienen sentido multi-tenant
(`subdomain`, `customDomain*`, `billingStatus`, `planId`, roles
`SUPER_ADMIN`/`RESELLER`). Quedan los modelos `Estate*` (propiedades,
contratos, cobranzas, emprendimientos, contactos, agentes, visitas,
tasaciones), `User`/`Account`/`Session` simplificados a un solo tenant
implícito (sin `tenantId` o con un tenant fijo, a definir en el detalle),
`Settings`, `AboutMedia`, logs.

**Esto es trabajo de migración de schema serio** (no un `prisma migrate
dev` trivial) — se hace una vez, a mano, directamente contra una base
nueva vacía del fork (no se migra la base de Urbi).

## Contenido inicial (branding + propiedades)

Se replica a mano el contenido del tenant `demo-inmo` como punto de
partida editable, no como vínculo vivo:

- Copiar los valores de `Settings` de `demo-inmo` (colores, nombre de
  tienda → "Gerreli", logo/footer-logo/favicon URLs, dirección, redes,
  `about_text`, `catalog_filters`) a un seed del fork.
- Las imágenes (logo, favicon, portada) están en R2 bajo
  `inmobiliarias/branding/` y `inmobiliarias/cmu35c3ty.../` — se copian
  (vía API de R2, `aws s3 cp` o descarga+reupload) al bucket/carpeta que
  use el fork, no se referencian cruzadas al bucket de Urbi.
- Las 8 propiedades de `demo-inmo` se exportan (consulta a la base local)
  y se re-insertan en la base nueva del fork vía un script de seed, como
  contenido de ejemplo editable por Gerreli.
- Un usuario `ADMIN` nuevo (no reusar `admin@demo-inmo.example`).

## Infraestructura del fork

- Carpeta: `/Users/facundoarteagasola/Documents/Apps/Gerreli app`.
- Se copia el working tree actual de `app_inmo` (sin `.git`, `node_modules`,
  `.next`) y se inicializa un repo git **nuevo**, sin remoto a
  `inmo_saas` — historia propia desde un commit inicial. El remoto de
  GitHub (si lo quiere) se decide después, no bloquea el trabajo.
- `.env` propio: `DATABASE_URL` a una base Postgres nueva (Docker aparte,
  puerto libre en su Mac — no la `pedidos`/`yaa-db-1` que ya existe),
  `ROOT_DOMAIN="gerellicorrenti.com.ar"` (sin subdominio: pasa a ser
  simplemente "el dominio", no un `ROOT_DOMAIN` con lógica de subdominios),
  **credenciales propias y separadas** de Google OAuth (client nuevo en
  Google Cloud, con `gerellicorrenti.com.ar` como redirect URI) y
  Cloudflare R2 (bucket o carpeta propia, no mezclado con el de Urbi) — se
  arman en una sesión posterior cuando se necesiten de verdad (local
  primero puede arrancar sin login con Google). **Confirmado: no hace
  falta Mercado Pago** — se saca del todo (`src/lib/mercadopago*.ts`,
  webhooks, campos de credenciales de MP en `Tenant`/`Settings`). Sin
  `GEMINI_API_KEY`/VAPID (no hay IA ni push).
- `package.json`: nombre del proyecto, sin dependencias ya sueltas
  (`web-push` ya se sacó en Urbi; revisar `@mercadopago/sdk` si no queda
  ningún consumidor).
- Deploy: mismo patrón que Urbi (VPS + Nginx + PM2 + certbot), pero **no**
  usa `scripts/provision-domains.sh` (ese script asume multi-tenant
  consultando `Tenant.subdomain`) — un solo `server_name
  gerellicorrenti.com.ar www.gerellicorrenti.com.ar` fijo, certificado
  único. Esto es trabajo de una sesión aparte, después de tener el código
  andando en local.

## Orden de trabajo propuesto (son varias sesiones, no una)

1. Copiar el repo a la carpeta nueva, git init, `.env` propio, base de
   datos Docker nueva, confirmar que el clon arranca igual que Urbi
   (antes de tocar nada).
2. Sacar multi-tenancy del código (proxy/tenant/auth) — la app pasa a
   asumir un solo tenant implícito.
3. Recortar el schema de Prisma y correr una migración `init` limpia
   contra la base nueva.
4. Borrar rutas/carpetas de los módulos no usados (lista de arriba), y
   arreglar los imports/referencias que queden colgando (van a aparecer
   muchos, como pasó con push/cupones en Urbi — se resuelve igual, por
   tandas, verificando con `tsc --noEmit` y `npm run build`).
5. Seed de contenido: branding + propiedades de `demo-inmo`, admin nuevo.
6. Verificar en local (`npm run dev`) que el front y el admin levantan y
   se ven como `demo-inmo`.
7. (Sesión aparte) Deploy a producción con el dominio real.

## Verificación

- `npx tsc --noEmit` y `npm run build` limpios en cada tanda de borrado
  (mismo método que usamos toda esta sesión para push/cupones/planes).
- `npm run dev` local: comparar visualmente `/` y `/admin` contra
  `http://demo-inmo.localhost:3010` tenant-por-tenant.
- Sin referencias sueltas a `getCurrentTenant`, `tenantId`, `subdomain`,
  `ROOT_DOMAIN` con lógica de subdominio, ni a los modelos de Prisma
  borrados (`grep` de verificación, como se hizo con push/loyalty).
