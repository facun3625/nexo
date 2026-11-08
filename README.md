# Urbi — pedidos online multi-tienda

Plataforma SaaS donde cada comercio tiene su tienda en un subdominio propio
(`mitienda.urbi.com.ar`) o en su dominio propio, y Urbi cobra una suscripción
por tienda. Next.js (App Router) + Prisma + PostgreSQL.

Hay tres paneles distintos, cada uno con su login:

| Panel | Dónde vive | Quién entra |
|---|---|---|
| Tienda | `mitienda.<ROOT_DOMAIN>/admin` | Dueño de la tienda (`ADMIN`) |
| Plataforma | `<ROOT_DOMAIN>/platform` | Equipo de Urbi (`SUPER_ADMIN`) |
| Cuenta Urbi | `<ROOT_DOMAIN>/mi-cuenta` | Dueño de tienda, revendedor, cliente |

## Arrancar en local

```bash
docker compose up -d          # PostgreSQL en el puerto 5452
cp .env.example .env          # completar los valores (ver comentarios adentro)
npx auth secret               # genera AUTH_SECRET
npm install
npx prisma migrate dev        # crea el esquema
npm run dev                   # http://localhost:3010
```

Los subdominios funcionan en local sin tocar `/etc/hosts`: los navegadores
resuelven `cualquier-cosa.localhost` a 127.0.0.1. O sea,
`http://mitienda.localhost:3010` entra a esa tienda.

### Variables de entorno

Todas están documentadas una por una en `.env.example`. Ninguna lleva el
prefijo `NEXT_PUBLIC_`: son secretos de servidor y no deben llegar al
navegador. `.env` está en `.gitignore` y nunca debe commitearse.

### Después de tocar el esquema de Prisma

```bash
npx prisma migrate dev --name lo_que_hiciste
npx prisma generate
```

Y **subí el número de `PRISMA_SCHEMA_VERSION` en `src/lib/prisma.ts`**. Next
conserva `globalThis` entre hot reloads, así que sin ese cambio el servidor de
desarrollo puede seguir usando el cliente de Prisma viejo y tirar errores del
tipo "la propiedad X no existe" sobre campos que sí agregaste. Si aun así
persiste, `rm -rf .next` y reiniciar `npm run dev`.

## Producción

### Nginx

Nginx va adelante de Next (que escucha en el 3010). Dos ajustes no son
opcionales:

```nginx
server {
  server_name urbi.com.ar *.urbi.com.ar;

  # El límite por defecto de Nginx es 1 MB y la app acepta hasta 20 MB
  # (fotos de producto, comprobantes de pago). Tiene que coincidir con
  # `serverActions.bodySizeLimit` y `proxyClientMaxBodySize` de
  # next.config.ts, o un archivo grande llega cortado y falla el upload.
  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:3010;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;

    # OJO: $remote_addr, NO $proxy_add_x_forwarded_for.
    # El segundo CONSERVA lo que el cliente haya mandado en ese header, y el
    # rate limiting lee justamente la primera IP de la lista — con la versión
    # que acumula, cualquiera puede falsear su IP y saltarse el límite de
    # intentos de login mandando su propio X-Forwarded-For.
    proxy_set_header X-Forwarded-For   $remote_addr;
  }
}
```

El certificado tiene que ser wildcard (`*.urbi.com.ar`) para que cada tienda
tenga HTTPS. Los dominios propios de clientes se agregan aparte, por dominio.

### Cron diario (obligatorio)

`/api/cron/billing` es lo que hace que la facturación avance sola: suspende
tiendas con la prueba vencida o impagas, aplica el período de gracia, y limpia
los intentos de rate limit viejos. **Nadie lo llama solo** — si no se programa,
las tiendas que dejan de pagar siguen funcionando indefinidamente.

```cron
0 3 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://urbi.com.ar/api/cron/billing
```

Sin `CRON_SECRET` definido el endpoint responde `401` a todo (falla cerrado, a
propósito). Usá un valor distinto al de local:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

### Backup diario de la base (obligatorio)

`/api/cron/backup` corre `pg_dump` contra la base y guarda el resultado en
`data/backups/`, conservando solo los últimos 5. **Nadie lo llama solo** — si
no se programa, no hay backups automáticos (solo los que se disparen a mano
desde `/platform/backups`).

Requiere `postgresql-client-16` instalado en el host (mismo major version que
el contenedor `postgres:16-alpine`):

```bash
apt install postgresql-client-16
```

```cron
0 4 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://urbi.com.ar/api/cron/backup
```

Usa el mismo `CRON_SECRET` que `/api/cron/billing`. Corrida a un horario
distinto (4 AM vs 3 AM) para no competir por disco/CPU al mismo minuto.

### Automatización de Contratos (opcional)

`/api/cron/estate-billing` genera las cuotas de alquiler y los punitorios de
los contratos activos de Gestión inmobiliaria, y calcula (sin aplicar solo)
las actualizaciones de alquiler que correspondan — quedan como sugerencias
pendientes de aprobar a mano en el listado de Contratos. Si no se programa,
Contratos sigue funcionando igual que hoy: todo se carga a mano desde
Cobranzas, como siempre.

```cron
0 5 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://urbi.com.ar/api/cron/estate-billing
```

Usa el mismo `CRON_SECRET`. Corrida después de `billing` (5 AM). Antes de
sumarla al crontab de producción, probarla a mano contra un contrato de
prueba y dejarla corriendo unos días solo en "modo revisión" (las
actualizaciones nunca se aplican solas, pero las cuotas y punitorios sí).

### Webhooks de Mercado Pago

Apuntar en el panel de Mercado Pago a:

- `https://urbi.com.ar/api/webhooks/mercadopago` — pagos sueltos
- `https://urbi.com.ar/api/webhooks/mercadopago/subscriptions` — suscripciones

Los dos validan la firma `x-signature` contra
`MERCADOPAGO_PLATFORM_WEBHOOK_SECRET` antes de creerle nada al mensaje, y
además re-consultan el estado contra la API de Mercado Pago en vez de confiar
en el cuerpo del POST.

## Notas de seguridad

Cosas que ya están resueltas y conviene no romper sin querer:

- **Permisos.** Toda Server Action y toda página del panel arranca con
  `requireTenantAdmin()` / `requireSuperAdmin()` / `requireOwnTenantAdmin()`
  **como primera línea**, antes de tocar la base. Si agregás una acción nueva,
  seguí ese patrón.
- **Aislamiento entre tiendas.** Toda consulta de la tienda filtra por
  `tenantId`, casi siempre con un `where: { id, tenantId }` compuesto. Nunca
  hagas `update({ where: { id } })` con un `id` que viene del cliente sin
  sumarle el `tenantId`: habilita que el admin de una tienda toque datos de
  otra probando ids. Las acciones de `/platform` sí usan `id` suelto, porque
  ahí el `SUPER_ADMIN` opera cross-tenant a propósito.
- **Rate limiting** (`src/lib/rate-limit.ts`). Login, registro y recuperar
  contraseña cuentan intentos fallidos en la tabla `RateLimitAttempt`. Se
  guarda en la base y no en memoria para que sobreviva reinicios y funcione
  con varios procesos de Next. El límite por cuenta (10 fallos / 15 min) es la
  defensa principal porque no depende de headers; el límite por IP es
  complementario y **depende de que Nginx reescriba `X-Forwarded-For`** como se
  explica arriba. Cuando bloquea, responde igual que con una contraseña
  incorrecta: decir "estás bloqueado" confirmaría que la cuenta existe.
- **Secretos de Mercado Pago de cada tienda.** Se guardan cifrados con
  AES-256-GCM (`src/lib/secret-box.ts`), con la clave derivada de
  `AUTH_SECRET`. Si cambiás `AUTH_SECRET` en producción, los tokens ya
  guardados dejan de poder descifrarse y hay que volver a cargarlos.
- **HTML de usuario.** El único `dangerouslySetInnerHTML` está en
  `src/components/catalog/rich-text.tsx` y pasa por DOMPurify con lista blanca
  de etiquetas. No agregues otro sin sanitizar.
- **Nada de SQL crudo.** No hay `$queryRaw` ni `$executeRaw` en el código de la
  app; todo va por el query builder de Prisma, que parametriza solo.

## Sesiones y multi-dominio

El login es un tema delicado acá porque conviven tres dominios distintos
(raíz, subdominio de tienda, dominio propio del cliente). Antes de tocar
`src/auth.ts`, `src/auth.config.ts`, `src/lib/auth-adapter.ts` o `src/proxy.ts`,
leé los comentarios largos que ya están ahí: explican cómo
funciona el "pase efímero" de un solo uso que mueve una sesión del dominio raíz
al subdominio de la tienda.

La sesión es JWT (sin estado). Eso significa que **borrar un usuario de la base
no invalida su sesión al instante**: su token sigue siendo válido hasta que
vence. Por eso `src/app/mi-cuenta/layout.tsx` vuelve a buscar el usuario en la
base y, si ya no existe, manda a `/api/auth/logout-all` en lugar de redirigir
a la home — si no, la sesión fantasma rebota para siempre sin explicación.
