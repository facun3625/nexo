# Guía: SaaS multi-tenant con subdominios, Google OAuth y dominios propios

Todo lo que costó resolver para que **yaa** funcione, escrito para poder
levantar la próxima app sin volver a pelear lo mismo.

El caso concreto: una plataforma que genera tiendas online. Cada tienda vive
en su propio subdominio (`mitienda.urbi.com.ar`) y, si paga el plan que lo
incluye, también en su dominio propio (`moulinscocina.com.ar`). Una persona
entra a la plataforma, se registra, paga, y termina siendo administradora de
su tienda — todo sin intervención manual.

Stack: Next.js 16 (App Router) · NextAuth v5 (`@auth/core`) · Prisma 7 ·
PostgreSQL · Nginx · Let's Encrypt · PM2.

---

## Índice

1. [La idea en una imagen](#1-la-idea-en-una-imagen)
2. [Multi-tenancy: cómo se sabe de qué tienda hablamos](#2-multi-tenancy-cómo-se-sabe-de-qué-tienda-hablamos)
3. [El modelo de datos](#3-el-modelo-de-datos)
4. [Autenticación: la parte difícil](#4-autenticación-la-parte-difícil)
5. [Google OAuth con infinitos subdominios](#5-google-oauth-con-infinitos-subdominios)
6. [Los tres bugs que costaron el día](#6-los-tres-bugs-que-costaron-el-día)
7. [Del registro al panel de admin, sin fricción](#7-del-registro-al-panel-de-admin-sin-fricción)
8. [Dominios propios](#8-dominios-propios)
9. [Deploy](#9-deploy)
10. [SSL: wildcard vs. certificado por tienda](#10-ssl-wildcard-vs-certificado-por-tienda)
11. [Por qué las pruebas locales no alcanzan](#11-por-qué-las-pruebas-locales-no-alcanzan)
12. [Checklist para la próxima app](#12-checklist-para-la-próxima-app)

---

## 1. La idea en una imagen

```
                    ┌──────────────────────────────┐
   urbi.com.ar ─────▶│                              │
                    │                              │
mitienda.urbi.com.ar ▶      UNA sola app Next.js    │──▶ PostgreSQL
                    │       (un proceso, un        │    (una sola base,
otratienda.yaa...  ─▶│        puerto, una base)    │     todo con tenantId)
                    │                              │
moulinscocina.com.ar▶│                             │
                    └──────────────────────────────┘
```

No hay una app por tienda. Hay **una sola app** que, en cada request, mira
por qué dominio entró el visitante y decide de qué tienda se trata. Todo lo
demás (productos, pedidos, usuarios) se filtra por ese `tenantId`.

Esto es lo que hace que crear una tienda sea instantáneo: es una fila en la
base, no un deploy.

---

## 2. Multi-tenancy: cómo se sabe de qué tienda hablamos

### El middleware traduce dominio → tienda

`src/proxy.ts` corre en **todos** los requests y deja el resultado en un
header que el resto de la app puede leer:

```ts
export default auth((req) => {
  const host = req.headers.get("host") ?? "";
  const subdomain = getSubdomain(host, ROOT_DOMAIN);

  const requestHeaders = new Headers(req.headers);
  if (subdomain) {
    requestHeaders.set("x-tenant-subdomain", subdomain);
  } else if (host && !isRootHost(host, ROOT_DOMAIN)) {
    // No matchea ni subdominio ni el dominio raíz — puede ser un dominio
    // propio de una tienda.
    requestHeaders.set("x-tenant-domain", host.split(":")[0]);
  }
  requestHeaders.set("x-pathname", pathname);
  // ...
});
```

Tres casos posibles:

| Host | Resultado |
|------|-----------|
| `urbi.com.ar` | ningún header → es la plataforma, no una tienda |
| `mitienda.urbi.com.ar` | `x-tenant-subdomain: mitienda` |
| `moulinscocina.com.ar` | `x-tenant-domain: moulinscocina.com.ar` |

### Resolver la tienda desde el header

`src/lib/tenant.ts`:

```ts
export const getCurrentTenant = cache(async () => {
  const hdrs = await headers();
  const subdomain = hdrs.get("x-tenant-subdomain");
  if (subdomain) return prisma.tenant.findUnique({ where: { subdomain } });

  const customDomain = hdrs.get("x-tenant-domain");
  if (customDomain) {
    return prisma.tenant.findFirst({
      where: { customDomain, customDomainVerified: true },
    });
  }
  return null;
});
```

Dos detalles que importan:

- **`cache()` de React** hace que, dentro de un mismo request, no se consulte
  la base de datos veinte veces por lo mismo.
- **`customDomainVerified: true`** no es opcional. Sin esa condición,
  cualquiera podría apuntar su dominio a tu servidor y quedarse con la tienda
  de otro. La verificación por DNS es lo que prueba que controla el dominio.

### El guard de admin

`src/lib/require-admin.ts` — corto, pero es el que evita el peor bug posible
de un SaaS multi-tenant: que el admin de una tienda entre a otra.

```ts
export async function requireTenantAdmin() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Tienda no encontrada");

  const session = await auth();
  if (session?.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    throw new Error("No autorizado");
  }
  return { session, tenant };
}
```

No alcanza con verificar que sea ADMIN. Hay que verificar que sea admin
**de esta tienda** (`session.user.tenantId !== tenant.id`).

---

## 3. El modelo de datos

Regla: **toda tabla que contenga datos de una tienda lleva `tenantId`**, y
las claves únicas son compuestas.

```prisma
model User {
  id       String  @id @default(cuid())
  tenantId String?           // null = usuario de la plataforma
  email    String
  role     Role    @default(CUSTOMER)

  @@unique([tenantId, email])   // ← no `email @unique`
}
```

El email es único **por tienda**, no globalmente. La misma persona puede ser
clienta de tres tiendas distintas con el mismo email, y son tres filas
distintas. Si pusieras `email String @unique`, la segunda tienda no podría
registrarla nunca.

### La trampa de Prisma con claves compuestas y `null`

`tenantId` es nullable (los usuarios de la plataforma no tienen tienda). Pero
Prisma **no acepta `null` en el atajo de clave compuesta**, aunque la columna
sí lo permita:

```ts
// ✗ No compila: tenantId_email exige string, no string | null
await prisma.user.findUnique({
  where: { tenantId_email: { tenantId: null, email } },
});

// ✓ Para el caso null hay que usar findFirst con filtro plano
await prisma.user.findFirst({ where: { tenantId: null, email } });
```

Motivo de fondo: en SQL, `NULL` nunca es igual a sí mismo, así que un índice
único no puede identificar una fila por un `NULL`. Aparece en `findUnique`,
`update`, `delete` y `upsert`. Se resuelve ramificando:

```ts
const user = tenantId === null
  ? await prisma.user.findFirst({ where: { tenantId: null, email } })
  : await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } } });
```

### Orden de las migraciones

Prisma aplica migraciones **por orden alfabético del nombre de carpeta**, que
por convención empieza con un timestamp. Si generás una migración que usa una
tabla creada en otra migración posterior, `prisma migrate deploy` explota en
producción con `P3018` — aunque en tu máquina anduviera, porque ahí las
fuiste aplicando de a una.

Si pasa: renombrá la carpeta a un timestamp correcto y limpiá el registro
fallido con `npx prisma migrate resolve --rolled-back <nombre_migracion>`.

---

## 4. Autenticación: la parte difícil

### Configuración dinámica por request

NextAuth v5 acepta una función en vez de un objeto. Esto es lo que permite
que la config **cambie según la tienda** desde la que se está entrando:

```ts
export const { handlers, auth, signIn, signOut } = NextAuth(async (req) => {
  const subdomain = req?.headers.get("x-tenant-subdomain") ?? null;
  const customDomain = req?.headers.get("x-tenant-domain") ?? null;
  const tenant = subdomain
    ? await prisma.tenant.findUnique({ where: { subdomain } })
    : customDomain
      ? await prisma.tenant.findFirst({ where: { customDomain, customDomainVerified: true } })
      : null;

  return {
    ...authConfig,
    adapter: tenantAwareAdapter(tenant?.id ?? null),
    pages: { ...authConfig.pages, signIn: tenant ? "/login" : "/registro" },
    redirectProxyUrl: `${IS_LOCAL ? "http" : "https"}://${ROOT_DOMAIN}/api/auth`,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [ /* ... */ ],
  };
});
```

Ojo con el `req?` opcional: esta función a veces corre **fuera** de un request
real, así que no se puede usar `headers()` de `next/headers` acá.

### El adapter tenant-aware

El adapter de Prisma que viene con Auth.js asume un mundo de una sola app:
un `User` global por email, una `Account` global por
`(provider, providerAccountId)`. En multi-tenant eso mezcla clientes de
tiendas distintas bajo un mismo usuario.

`src/lib/auth-adapter.ts` lo envuelve para que todo ocurra **dentro** del
tenant que originó el login:

```ts
export function tenantAwareAdapter(tenantId: string | null): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,
    createUser: async ({ id: _id, ...data }) =>
      prisma.user.create({ data: { ...data, tenantId } }),

    getUserByEmail: async (email) => {
      if (tenantId === null) {
        // El espacio tenantId null mezcla dos cosas que NO deben pisarse:
        // el super admin y quien se está registrando todavía sin tienda.
        return prisma.user.findFirst({
          where: { tenantId: null, email, role: "CUSTOMER" },
        });
      }
      return prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } } });
    },
    // getUserByAccount, linkAccount, unlinkAccount: misma idea
  };
}
```

> **El filtro `role: "CUSTOMER"` no es cosmético.** Sin él, alguien
> registrándose con Google usando el mismo email que el super admin
> terminaba **logueado como el super admin**. Pasó de verdad, y hubo que
> borrar a mano la fila de `Account` que quedó mal vinculada.

### `trustHost` va en las DOS configs

Este es sutil y solo aparece en producción. Hay **dos** instancias de
NextAuth en la app:

1. La completa, en `src/auth.ts` (Prisma, bcrypt, providers).
2. Una liviana que arma el middleware desde `src/auth.config.ts`, porque el
   middleware corre en Edge y no puede cargar Prisma.

Si `trustHost: true` está solo en la primera, en local no se nota
(Auth.js confía en `localhost` automáticamente), pero en un dominio real el
middleware rechaza **todos** los requests:

```
[auth][error] UntrustedHost: Host must be trusted. URL was: https://urbi.com.ar/api/auth/session
```

Y como el middleware corre en prácticamente todas las páginas, se cae el
sitio entero.

```ts
// src/auth.config.ts
export default {
  providers: [],
  trustHost: true,   // ← también acá
  pages: { signIn: "/login" },
  callbacks: { /* ... */ },
} satisfies NextAuthConfig;
```

### Las sesiones JWT no se refrescan solas

Con `session: { strategy: "jwt" }`, los datos del usuario viven **dentro del
token**, no se releen de la base en cada request. Consecuencia concreta:
alguien se registra (su JWT dice `tenantId: null`), completa el alta de la
tienda (la fila de `User` pasa a `tenantId: "abc"`, rol `ADMIN`)… y su JWT
sigue diciendo `tenantId: null`. Podía volver a entrar al circuito de
registro como si no tuviera tienda.

Donde importa, hay que reverificar contra la base:

```ts
export async function requireOnboardingUser() {
  const session = await auth();
  if (!session?.user) redirect("/registro");

  // No confiar en session.user.tenantId: el JWT puede ser viejo.
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "CUSTOMER" || user.tenantId) redirect("/registro");

  return { ...session, user: { ...session.user, id: user.id } };
}
```

---

## 5. Google OAuth con infinitos subdominios

### El problema

Google **no acepta wildcards** en los redirect URIs. No podés registrar
`https://*.urbi.com.ar/api/auth/callback/google`. Y no vas a entrar a la
consola de Google a mano cada vez que alguien crea una tienda.

### La solución: `redirectProxyUrl`

Auth.js tiene exactamente esto resuelto. Se registra **un solo** redirect URI
en Google Cloud Console:

```
https://urbi.com.ar/api/auth/callback/google
```

Y en la config:

```ts
redirectProxyUrl: `https://${ROOT_DOMAIN}/api/auth`,
```

### Cómo funciona por dentro

Vale la pena entenderlo, porque todos los bugs de esta sección vienen de acá.

```
1. Cliente en tienda1.urbi.com.ar toca "Continuar con Google"
   └─ tienda1 setea las cookies state/PKCE/nonce EN SU PROPIO DOMINIO
   └─ manda al navegador a Google con:
        redirect_uri = https://urbi.com.ar/api/auth/callback/google
        state        = JWT FIRMADO que lleva dentro "vengo de tienda1"

2. Google autentica y vuelve a urbi.com.ar (el único URI registrado)

3. urbi.com.ar abre el state LEYÉNDOLO DEL QUERY STRING — sin tocar
   ninguna cookie, es pura criptografía con AUTH_SECRET — ve el origen,
   y rebota el navegador a:
        https://tienda1.urbi.com.ar/api/auth/callback/google?code=...

4. tienda1 lee SUS PROPIAS cookies, canjea el code, crea la sesión. Fin.
```

En el código de `@auth/core` (`lib/actions/callback/index.js`) está el
comentario que lo confirma:

> *We rely on the state being encrypted using a shared secret between the
> proxy and the original server.*

**La consecuencia importante:** el login arranca y termina en el **mismo
origen**. Las cookies nunca necesitan viajar entre dominios. Por eso esto
funciona igual para un subdominio que para el dominio propio de un cliente
(`moulinscocina.com.ar`), donde compartir cookies sería imposible.

### Lo que NO hay que hacer

Durante horas el login falló con:

```
[auth][error] InvalidCheck: state value could not be parsed
```

El intento de arreglo fue forzar un `domain` compartido en las cookies para
que viajaran entre subdominios:

```ts
// ✗ NO hacer esto
cookies: {
  state: { options: { domain: `.${ROOT_HOSTNAME}` } },
  pkceCodeVerifier: { options: { domain: `.${ROOT_HOSTNAME}` } },
}
```

Eso **tapa el síntoma y rompe el dominio propio**. Las cookies deben ser
host-only. El `InvalidCheck` real venía de otro lado — la próxima sección.

---

## 6. Los tres bugs que costaron el día

Los tres tienen el mismo tema de fondo: **en producción, el host real de un
request no llega a donde tiene que llegar**.

### Bug 1 — Next.js aplasta el host del request

**El síntoma:** `InvalidCheck: state value could not be parsed` en cada login
con Google desde un subdominio.

**El diagnóstico.** Una ruta de prueba que devuelve lo que Next.js reporta,
pedida desde `tienda.localhost:3010`:

```json
{
  "reqUrl":        "http://localhost:3010/api/debughost",   // ✗
  "nextUrlOrigin": "http://localhost:3010",                 // ✗
  "headerHost":    "tienda.localhost:3010",                 // ✓
  "headerXfHost":  "tienda.localhost:3010"                  // ✓
}
```

Los **headers traen el host correcto**, pero `req.url` viene con el host
aplastado al del servidor. Y Auth.js construye toda su identidad a partir de
`req.url`.

**La cadena de fallas** que eso provoca:

1. Auth.js cree que toda tienda es el dominio raíz.
2. Como cree que ya está parado en el proxy, **no guarda el origen dentro del
   `state` firmado**.
3. Al volver de Google no tiene a dónde rebotar, y procesa el callback en el
   dominio raíz.
4. Busca ahí las cookies de state/PKCE, que el navegador dejó en el
   subdominio → `InvalidCheck`.

**La solución:** reponer el host real antes de que Auth.js vea el request.

```ts
// src/app/api/auth/[...nextauth]/route.ts
function withRealHost(handler: (req: NextRequest) => Promise<Response>) {
  return (req: NextRequest) => {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!host) return handler(req);

    const url = new URL(req.url);
    if (url.host === host) return handler(req);

    const [hostname, port = ""] = host.split(":");
    url.hostname = hostname;
    url.port = port;
    url.protocol = req.headers.get("x-forwarded-proto") ?? url.protocol;
    return handler(new NextRequest(url, req));
  };
}

export const GET = withRealHost(handlers.GET);
export const POST = withRealHost(handlers.POST);
```

Con eso, cada tienda vuelve a ser su propio origen y el mecanismo de
`redirectProxyUrl` funciona como fue diseñado. **Y las cookies compartidas
dejan de hacer falta.**

### Bug 2 — El setter de `url.host` se queda con el puerto viejo

Esta es una trampa del API de URL de JavaScript, y es venenosa porque
**es imposible de reproducir en local**.

```js
const url = new URL("http://localhost:3014/api/auth/signout");
url.host = "mitienda.urbi.com.ar";      // header sin puerto (443 es implícito)
url.href
// → "http://mitienda.urbi.com.ar:3014/api/auth/signout"
//                               ^^^^^ el puerto viejo quedó pegado
```

Por especificación, si el valor asignado **no trae puerto**, el puerto
existente se conserva.

**Qué provocaba:**

- **Cerrar sesión** → redirigía a `urbi.com.ar:3014`, un puerto que desde
  afuera no responde → pantalla de error.
- **Login colgado** → el `fetch` del cliente seguía ese mismo redirect y se
  quedaba esperando hasta agotar el timeout. La sesión **sí** se creaba del
  lado del servidor: al refrescar a mano, ya estabas adentro.

**Por qué en local nunca se vio:** el puerto de desarrollo (3010) no es
estándar, así que el navegador **siempre** lo manda en el header `Host`. Con
puerto en el valor nuevo, el setter reemplaza las dos mitades y todo anda.
En producción con HTTPS, el puerto es 443, el header viene sin él, y el bug
aparece.

**La solución:** asignar `hostname` y `port` por separado (está en el código
de arriba). Asignar `port = ""` limpia el puerto viejo.

### Bug 3 — `trustHost` faltaba en la config del middleware

Ya explicado en la sección 4. Mismo patrón: invisible en `localhost`, fatal
en un dominio real.

---

## 7. Del registro al panel de admin, sin fricción

El objetivo: alguien entra a la plataforma sin cuenta y termina adentro del
panel de su tienda **sin volver a escribir la contraseña**.

```
/registro          → crea User (tenantId: null, role: CUSTOMER)
                     por email+contraseña o con Google
        ↓
/registro/plan     → elige un Plan real de la base → User.pendingPlanId
        ↓
/registro/pago     → pago simulado → User.onboardingPaidAt
        ↓
/registro/datos    → nombre de la tienda + subdominio
        ↓
   ¡Tienda creada!  → redirige ya logueado a mitienda.urbi.com.ar/admin
```

### El paso final, que es el que tiene truco

Al crear la tienda pasan varias cosas en **una transacción**:

```ts
const tenant = await prisma.$transaction(async (tx) => {
  const tenant = await tx.tenant.create({
    data: { subdomain, planId: user.pendingPlanId, billingStatus: "ACTIVE", nextBillingDate },
  });

  await tx.settings.create({ data: { tenantId: tenant.id, key: "store_name", value: storeName } });
  await tx.paymentMethodConfig.createMany({ /* defaults */ });
  await tx.fulfillmentMethodConfig.createMany({ /* defaults */ });

  // El usuario pasa a ser el admin de esta tienda: mismo User, ya no
  // "pendiente".
  await tx.user.update({
    where: { id: user.id },
    data: { tenantId: tenant.id, role: "ADMIN", pendingPlanId: null, onboardingPaidAt: null },
  });

  // Sus cuentas de Google se re-scopean al tenant nuevo, para que el login
  // con Google siga funcionando en el subdominio.
  await tx.account.updateMany({
    where: { userId: user.id, tenantId: null },
    data: { tenantId: tenant.id },
  });

  return tenant;
});
```

### Por qué hace falta un token de un solo uso

La sesión se creó en `urbi.com.ar`. La tienda nueva vive en
`mitienda.urbi.com.ar`. **Para el navegador son dominios distintos**: el
cookie de sesión no viaja solo. Sin resolverlo, el usuario aterriza en el
panel de su tienda recién creada… y le pide login otra vez. Pésima primera
impresión, y peor todavía si se registró con Google (no tiene contraseña que
escribir).

La solución reutiliza la tabla `VerificationToken` que ya trae Auth.js:

```ts
const token = randomBytes(32).toString("hex");
await prisma.verificationToken.create({
  data: {
    identifier: `onboarding:${user.id}`,
    token,
    expires: new Date(Date.now() + 5 * 60 * 1000),   // 5 minutos
  },
});

redirect(
  `${protocol}://${tenant.subdomain}.${ROOT_DOMAIN}` +
  `/login?onboarded=1&callbackUrl=%2Fadmin&token=${token}`
);
```

Del otro lado, un provider de credenciales con `scope: "magic-token"`
lo canjea:

```ts
if (scope === "magic-token") {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date() || !record.identifier.startsWith("onboarding:")) {
    return null;
  }
  // Se borra ANTES de devolver el usuario: un solo uso, sin excepciones.
  await prisma.verificationToken
    .delete({ where: { identifier_token: { identifier: record.identifier, token } } })
    .catch(() => {});

  const userId = record.identifier.slice("onboarding:".length);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.tenantId) return null;
  return { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, /* ... */ };
}
```

Propiedades que lo hacen seguro: vive 5 minutos, se borra al primer uso, y
el prefijo `onboarding:` impide que sirva para otra cosa.

### El guard de React Strict Mode

En desarrollo, React monta-desmonta-remonta los efectos. Con un token de un
solo uso, la segunda ejecución falla siempre. Hay que blindarlo:

```tsx
const magicTokenUsed = useRef(false);
useEffect(() => {
  if (!magicToken || magicTokenUsed.current) return;
  magicTokenUsed.current = true;
  // ... consumir el token
}, [magicToken]);
```

Sin el `useRef`, se ve un error de login en la consola aunque el login
después funcione.

---

## 8. Dominios propios

Una tienda en un plan que lo permita puede usar su propio dominio en vez del
subdominio.

### Gating por plan

```prisma
model Plan {
  id                String  @id @default(cuid())
  name              String  @unique
  priceMonthly      Decimal
  allowCustomDomain Boolean @default(false)   // ← el interruptor
  // ...
}
```

El super admin lo prende por plan desde el panel, y la pestaña "Dominio
propio" solo aparece si `tenantBilling.plan?.allowCustomDomain`. Vender la
función es configuración, no código.

### Verificación por DNS

Antes de servir una tienda en un dominio hay que probar que quien lo pidió
**controla ese dominio**. Si no, cualquiera apunta su dominio a tu servidor y
se queda con la tienda de otro.

```ts
export function generateDomainToken() {
  return `urbi-verify-${randomBytes(12).toString("hex")}`;
}

export function verificationRecordName(domain: string) {
  return `_urbi-challenge.${domain}`;
}

export async function verifyDomainTxtRecord(domain: string, token: string) {
  try {
    const records = await resolveTxt(verificationRecordName(domain));
    return records.some((chunks) => chunks.join("").trim() === token);
  } catch {
    return false;
  }
}
```

El flujo: la tienda carga su dominio → la app genera un token y le muestra
qué registro TXT crear → lo crea en su DNS → toca "Verificar" → si el TXT
coincide, `customDomainVerified = true`.

> **Usá el nombre del producto, no el de tu agencia.** El registro
> `_urbi-challenge` lo lee y lo tipea el cliente final. Nosotros lo teníamos
> como `_kubbo-challenge` (el nombre del estudio) y había que corregirlo.

### Y del lado del servidor

La app ya sabe resolver el tenant por dominio propio (sección 2), pero
**servirlo** necesita dos cosas más en el servidor, y ninguna se puede
preparar de antemano porque son dominios que no conocés hasta que el cliente
los carga:

1. Un `server` block de Nginx que responda a ese dominio.
2. Un certificado SSL para ese dominio.

Eso está automatizado en `scripts/provision-domains.sh` (sección 10).

---

## 9. Deploy

Sobre un VPS con Nginx y otras apps ya corriendo.

### Puertos

Elegí uno libre para la app y otro para su base:

```bash
sudo ss -tlpn          # o: sudo netstat -tlpn | grep LISTEN
pm2 list
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Base de datos

```bash
Urbi_DB_PASS=$(openssl rand -base64 24 | tr -d '/+=')

docker run -d \
  --name urbi-db \
  -p 127.0.0.1:5443:5432 \
  -e POSTGRES_USER=yaa_user \
  -e POSTGRES_PASSWORD="$Urbi_DB_PASS" \
  -e POSTGRES_DB=yaa_db \
  -v yaa_pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16-alpine

echo "GUARDÁ ESTO: $Urbi_DB_PASS"
```

`-p 127.0.0.1:5443:5432` y no `-p 5443:5432`: la base **no** tiene por qué
estar expuesta a internet, solo la app local le pega.

### Variables de entorno

```bash
DATABASE_URL="postgresql://yaa_user:<PASS>@localhost:5443/yaa_db?schema=public"
ROOT_DOMAIN="urbi.com.ar"
AUTH_SECRET="<openssl rand -base64 33>"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
PORT=3014
```

`AUTH_SECRET` de producción tiene que ser nuevo, no el de desarrollo: es la
clave con la que se firman los JWT de sesión **y el `state` de OAuth**.

### Instalar y arrancar

```bash
npm install
npx prisma migrate deploy      # NO db push: hay migraciones versionadas
npx prisma generate
npm run build

PORT=3014 pm2 start npm --name "yaa" -- start
pm2 save
pm2 startup                    # y correr el comando que imprime
```

> **El script `start` no puede tener el puerto hardcodeado.**
> `next start -p 3010` ignora `PORT` y arranca producción en el puerto
> equivocado. Tiene que ser `next start` a secas.

### Nginx

```nginx
server {
    listen 80;
    server_name urbi.com.ar www.urbi.com.ar *.urbi.com.ar;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name urbi.com.ar www.urbi.com.ar *.urbi.com.ar;

    ssl_certificate     /etc/letsencrypt/live/urbi.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urbi.com.ar/privkey.pem;

    location / {
        proxy_pass http://localhost:3014;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;   # ← IMPRESCINDIBLE
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 20M;
}
```

Dos líneas que no son opcionales:

- **`server_name ... *.urbi.com.ar`** — sin el wildcard, ningún subdominio de
  tienda matchea este bloque.
- **`proxy_set_header X-Forwarded-Host $host`** — de acá saca la app el host
  real (bug 1 de la sección 6). Sin esto, el login con Google y el cerrar
  sesión se rompen en producción.

Y `client_max_body_size` tiene que coincidir con el límite de la app:

```ts
// next.config.ts
experimental: {
  proxyClientMaxBodySize: "20mb",
  serverActions: { bodySizeLimit: "20mb" },
}
```

Si Nginx permite menos que la app, las fotos grandes se cortan a mitad de
subida con un error confuso (`Unexpected end of form`).

### DNS

En el registrador (para `.com.ar`, **NIC Argentina**) hay que **delegar** el
dominio a los nameservers de tu hosting. Ese paso es aparte de cargar los
registros, y es fácil de olvidar: si no está hecho, el dominio no resuelve
**nada** y ninguna cantidad de configuración del servidor lo arregla.

Se verifica así:

```bash
dig urbi.com.ar NS +short        # ¿vacío? → falta delegar en el registrador
```

Después, en el panel de DNS del hosting:

| Tipo | Nombre | Contenido |
|------|--------|-----------|
| A | `urbi.com.ar` | IP del VPS |
| A | `www.urbi.com.ar` | IP del VPS |
| A | `*.urbi.com.ar` | IP del VPS |

El `*` es el que hace que cualquier tienda nueva resuelva sin tocar nada.

```bash
dig +short cualquiercosa.urbi.com.ar    # tiene que devolver la IP del VPS
```

---

## 10. SSL: wildcard vs. certificado por tienda

Acá hay una decisión real, con una trampa escondida.

### El wildcard y su problema

Un certificado `*.urbi.com.ar` cubre infinitas tiendas. Suena ideal, pero
Let's Encrypt **solo emite wildcards por desafío DNS**, nunca por HTTP:

```bash
certbot certonly --manual --preferred-challenges dns \
  -d urbi.com.ar -d "*.urbi.com.ar" --agree-tos -m tu@email.com
```

Y ahí está la trampa, que certbot avisa al terminar:

> *This certificate will **not** be renewed automatically. Autorenewal of
> --manual certificates requires the use of an authentication hook script.*

Un desafío manual necesita que **una persona** cargue un TXT. A los 90 días,
si nadie lo hizo, **todas las tiendas dejan de andar**. Se automatiza con un
plugin de certbot para tu proveedor de DNS, pero los proveedores chicos
(DonWeb/Hostmar, por ejemplo) no tienen plugin.

Detalle práctico si lo hacés a mano: pide **dos** TXT con el mismo nombre
(uno para el dominio, otro para el wildcard) y tienen que estar **los dos a
la vez**. No reemplaces el primero por el segundo.

### La alternativa: un certificado por tienda

Cada subdominio saca su propio certificado por **desafío HTTP**, que certbot
sí renueva solo. Al emitirlo dice justamente lo contrario:

> *Certbot has set up a scheduled task to automatically renew this
> certificate in the background.*

El techo: Let's Encrypt permite **50 certificados nuevos por dominio
registrado cada 7 días** (~200 altas nuevas por mes). Las renovaciones **no
consumen cupo**, así que el límite aplica solo a tiendas nuevas, y el cupo se
libera de a uno cada ~3 horas.

### La comparación

| | Wildcard | Uno por tienda |
|---|---|---|
| Renovación | manual cada 90 días* | automática |
| Techo de tiendas | sin techo | ~200 altas nuevas/mes |
| HTTPS en tienda nueva | instantáneo | ~30 seg (cuando corre el script) |
| Depende de | el plugin DNS de tu proveedor | nada |

\* automática si tu proveedor de DNS tiene plugin de certbot (Cloudflare,
Route53, etc. lo tienen; su plan gratuito alcanza).

**Lo que elegimos:** un certificado por tienda, porque no depende de nadie y
se renueva solo. El wildcard quedó como red de seguridad hasta que venza —
Nginx prioriza el bloque específico sobre el wildcard, así que conviven sin
problema durante la transición.

### El script que lo automatiza

`scripts/provision-domains.sh` lee de la base **todos** los dominios por los
que se llega a una tienda (su subdominio y, si lo verificó, su dominio
propio) y le da de alta a cada uno lo que le falte: bloque de Nginx +
certificado.

Lo que hace bien, y conviene copiar:

- **Es idempotente.** Saltea lo ya configurado, así que se puede correr por
  cron sin miedo.
- **Chequea DNS antes de llamar a certbot.** Si el dominio todavía no apunta
  al servidor, lo saltea. Los intentos fallidos consumen cupo de Let's
  Encrypt.
- **No toca lo que no escribió.** Marca sus archivos con un comentario y se
  niega a modificar un `server` block ajeno — clave en un VPS con otras apps.
- **Valida con `nginx -t` antes de recargar.** Si la config está rota, no
  recarga y no se lleva puesto el resto del servidor.
- **`www` solo donde corresponde.** En `moulinscocina.com.ar` tiene sentido;
  en `tienda.urbi.com.ar` no entra nadie a `www.`, y como el wildcard de DNS
  igual lo resuelve, se colaba en el certificado. Si algún día ese nombre
  deja de resolver, **falla la renovación del certificado entero**.

Y en cron, para que una tienda nueva tenga HTTPS sin intervención:

```bash
(crontab -l 2>/dev/null; echo "*/10 * * * * /root/yaa/yaa/scripts/provision-domains.sh >> /var/log/urbi-domains.log 2>&1") | crontab -
```

### Cómo saber si un certificado se renueva solo

```bash
grep -H "authenticator" /etc/letsencrypt/renewal/*.conf
```

`authenticator = nginx` o `= webroot` → se renueva solo.
`authenticator = manual` → **no**, hay que hacerlo a mano.

---

## 11. Por qué las pruebas locales no alcanzan

Los tres bugs de la sección 6 pasaron una suite de 18 pruebas end-to-end en
local. No es que las pruebas estuvieran mal escritas: **el entorno local no
puede reproducir esas condiciones**.

| Diferencia | Qué esconde |
|---|---|
| `localhost` es un dominio de una sola etiqueta | Chromium descarta `Domain=.localhost`. Manda por una pista falsa cuando el problema era otro. |
| Auth.js confía en `localhost` automáticamente | Esconde que falta `trustHost`. |
| El puerto de dev (3010) no es estándar | El header `Host` siempre lo trae, y esconde el bug del puerto que se queda pegado. |
| No hay proxy inverso | No existen `X-Forwarded-Host` ni `X-Forwarded-Proto`, que en prod son de donde sale el host real. |
| HTTP, no HTTPS | Las cookies `__Secure-` y `__Host-` se comportan distinto. |

**La conclusión práctica:** para una app multi-tenant con OAuth, un entorno
de staging con **dominio real, HTTPS real y proxy inverso real** no es un
lujo. Es el único lugar donde estos bugs existen.

Lo que sí sirvió en local: pruebas que miran el **mecanismo** en vez del
resultado. Por ejemplo, para el bug de las cookies, en vez de intentar
loguearse con Google de verdad, cortar el viaje justo antes y preguntarle al
navegador qué cookies guardó:

```js
await page.route("**://accounts.google.com/**", (route) => route.abort());
await page.click('button:has-text("Continuar con Google")');

const cookies = await ctx.cookies();
const oauth = cookies.filter((c) => /state|pkce|nonce/i.test(c.name));
console.log(oauth.length ? "COOKIES OK" : "COOKIES DESCARTADAS");
```

Eso da un veredicto binario en segundos, sin credenciales de Google, y fue lo
que permitió aislar el problema real.

---

## 12. Checklist para la próxima app

### Arquitectura

- [ ] Middleware que traduzca host → tenant y lo deje en un header
- [ ] `getCurrentTenant()` cacheado por request, que resuelva subdominio **y**
      dominio propio (con `customDomainVerified: true`)
- [ ] Guard que verifique rol **y** pertenencia al tenant
- [ ] `tenantId` en toda tabla de datos; claves únicas compuestas
      (`@@unique([tenantId, email])`)
- [ ] Ramificar a `findFirst` donde `tenantId` pueda ser `null`

### Auth

- [ ] `NextAuth(async (req) => ...)` para config por tenant
- [ ] Adapter que scopee `createUser` / `getUserByEmail` / `getUserByAccount`
      / `linkAccount` al tenant
- [ ] Filtrar por rol en el espacio `tenantId: null` (que no se pise el super
      admin con quien se registra)
- [ ] **`trustHost: true` en las DOS configs** (runtime y middleware)
- [ ] `redirectProxyUrl` apuntando al dominio raíz, y **un solo** redirect URI
      en Google
- [ ] Cookies de OAuth **host-only** — sin `domain` compartido
- [ ] Wrapper que reponga el host real desde `x-forwarded-host`, asignando
      **`hostname` y `port` por separado**
- [ ] Reverificar contra la base donde el JWT pueda estar viejo

### Onboarding

- [ ] Usuario "pendiente" (`tenantId: null`) que después se promueve
- [ ] Crear tienda + settings + defaults + promover usuario en **una
      transacción**
- [ ] Re-scopear las `Account` de OAuth al tenant nuevo
- [ ] Token de un solo uso para el salto entre dominios (5 min, se borra al
      usarse)
- [ ] `useRef` para blindar el consumo del token de React Strict Mode

### Deploy

- [ ] `start` sin puerto hardcodeado
- [ ] `prisma migrate deploy` (no `db push`) y verificar el orden de las
      migraciones
- [ ] `AUTH_SECRET` nuevo para producción
- [ ] Delegar el dominio en el registrador (`dig <dominio> NS +short`)
- [ ] Registros A: raíz, `www` y `*`
- [ ] Nginx con `*.dominio` en `server_name` y **`X-Forwarded-Host`**
- [ ] `client_max_body_size` igual al límite de la app
- [ ] Script de provisión de dominios + cron
- [ ] Verificar que ningún certificado quede en `authenticator = manual`

### Antes de decir que anda

- [ ] Probarlo en un dominio real con HTTPS, no solo en `localhost`
- [ ] Login con Google desde un subdominio de tienda
- [ ] Cerrar sesión desde el panel de una tienda
- [ ] Alta completa: registro → plan → pago → tienda → panel
- [ ] Una tienda con dominio propio, de punta a punta

---

## Apéndice: errores y qué significan

| Error | Causa probable |
|---|---|
| `InvalidCheck: state value could not be parsed` | El host real no llega a Auth.js. Revisar `X-Forwarded-Host` y el wrapper de la ruta. |
| `UntrustedHost: Host must be trusted` | Falta `trustHost: true` — casi siempre en la config del middleware. |
| Login que se cuelga sin error | Un `fetch` siguiendo un redirect a un puerto inalcanzable. Revisar el puerto pegado en `url.host`. |
| `error=Configuration` en `/api/auth/error` | Genérico. El motivo real está en el log del servidor como `[auth][cause]`. |
| `P3018` al migrar | Orden de migraciones: una usa una tabla que otra crea después. |
| `Unexpected end of form` al subir imágenes | `client_max_body_size` de Nginx menor que el límite de la app. |
| `SASL: client password must be a string` | `DATABASE_URL` no está cargada. A un script suelto hay que darle `import "dotenv/config"`. |
| Google entra como otro usuario | Falta filtrar por rol en `getUserByEmail` cuando `tenantId` es `null`. |

---

*Escrito a partir de la puesta en producción de yaa (agosto 2026). Los
tramos de código son del repositorio, no ejemplos inventados.*
