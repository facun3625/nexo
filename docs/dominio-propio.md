# Dominio propio

Una tienda puede publicarse en un dominio propio (ej: `pedidos.mimarca.com`)
además de su subdominio de siempre (`mimarca.urbi.com.ar`) — ambos siguen
funcionando en paralelo, no es un reemplazo. Requiere un plan con
`allowCustomDomain` habilitado.

## Modelo de datos

En `Tenant` (`prisma/schema.prisma`):

- `customDomain String? @unique` — el dominio cargado.
- `customDomainToken String?` — token random que se pide como registro TXT
  para probar que el dueño del dominio es quien lo está cargando.
- `customDomainVerified Boolean @default(false)` — solo un dominio
  verificado resuelve tráfico real (ver "Cómo se resuelve" abajo).

En `Plan`: `allowCustomDomain Boolean @default(false)` — gatea únicamente la
UI de autogestión de `/admin/configuracion` (`assertCustomDomainAllowed` en
`src/app/admin/configuracion/actions.ts`). La resolución de tráfico
(`getCurrentTenant()`, `auth.ts`) no vuelve a chequear el plan: si
`customDomainVerified` es `true`, el dominio sirve la tienda sin importar el
plan actual. Bajar de plan no rompe un dominio ya verificado por las suyas
— para desactivarlo de verdad hay que borrarlo (autogestión o override,
ver abajo).

`DomainRequest` (con enum `DomainRequestStatus`: `PENDING | IN_PROGRESS |
DONE`) es un modelo aparte para el flujo asistido ("hacelo vos por mí"),
sin relación con `customDomain` más que compartir `tenantId`.

## Flujo de autogestión (`/admin/configuracion`)

Implementado en `src/app/admin/configuracion/actions.ts` +
`custom-domain-form.tsx`:

1. **Cargar dominio** (`setCustomDomain`): valida formato
   (`dominio.regex`), chequea que nadie más lo tenga cargado
   (`Tenant.customDomain` es único), genera un `customDomainToken` nuevo y
   deja `customDomainVerified: false`.
2. **Verificar** (`verifyCustomDomain`): resuelve por DNS el TXT en
   `_urbi-challenge.<dominio>` (`src/lib/custom-domain.ts`,
   `resolveTxt` de `node:dns/promises`) y confirma que contenga el token
   guardado. Si coincide, marca `customDomainVerified: true`. El dueño de
   la tienda tiene que haber cargado ese TXT en su propio proveedor de DNS
   antes de este paso — la app no compra ni administra dominios por sí
   sola en este flujo.
3. **Quitar** (`removeCustomDomain`): limpia los tres campos.

## Flujo asistido — "que lo haga Urbi" (`DomainRequest`)

Para quien no quiere lidiar con comprar el dominio y cargar el TXT a mano:
`createDomainRequest` (mismo archivo de actions) guarda nombre/email/
teléfono de contacto, hasta 3 opciones de dominio y notas — sin comprar ni
cargar nada automáticamente. El super admin gestiona estos pedidos a mano
desde `/platform/dominios` (`domain-request-row.tsx`, cambia el `status`
del pedido a medida que lo resuelve por fuera de la app) y, una vez
comprado y con el TXT cargado del lado del proveedor, carga el resultado
en la tienda mediante el override descripto abajo.

## Cómo se resuelve el tráfico

`src/proxy.ts` (middleware) mira el header `Host` de cada request:

- Si matchea `<algo>.<ROOT_DOMAIN>`, setea `x-tenant-subdomain`.
- Si no matchea el dominio raíz ni un subdominio propio, asume que puede
  ser un dominio propio y setea `x-tenant-domain` con el host tal cual.
- Ambos headers se borran primero de lo que mandó el cliente (spoofing:
  cualquiera podría mandar `x-tenant-subdomain: otra-tienda` a mano).

`src/lib/tenant.ts` (`getCurrentTenant`) y `src/auth.ts` leen esos headers
en ese orden — subdominio primero, dominio propio después — y para
`x-tenant-domain` exigen `customDomainVerified: true`. Un dominio cargado
pero no verificado no resuelve tráfico ni permite login.

No hay provisioning de DNS/TLS automatizado: el certificado y el registro
A/CNAME del dominio hacia el servidor los arma quien administra la
infraestructura (fuera de esta app) cuando corresponde.

## Edición manual desde `/platform` (soporte)

`/platform/tiendas/[tenantId]` tiene un formulario de override
(`custom-domain-override-form.tsx`, acción `overrideCustomDomain` en
`actions.ts` de esa misma carpeta) para que el super admin pueda:

- Cargar o corregir el dominio de una tienda a mano, con las mismas
  validaciones de formato y unicidad que la autogestión.
- Marcar `customDomainVerified` sin depender de un chequeo de DNS en vivo
  — útil cuando el TXT ya se confirmó por otra vía (DNS lento, dominio
  detrás de un proxy tipo Cloudflare que oculta el registro real) o para
  cargar el resultado de un pedido resuelto vía `DomainRequest`.
- Dejar el campo vacío quita el dominio propio de la tienda (equivalente
  a `removeCustomDomain`).

Cambiar el dominio regenera el token de verificación (por si más adelante
hace falta reverificar); tocar solo el checkbox de "Verificado" sobre el
mismo dominio no lo toca.

## Pendiente / fuera de alcance actual

- No hay compra ni configuración automática de DNS/TLS: todo el circuito
  de `DomainRequest` se resuelve a mano por fuera de la app.
- No hay reintento automático de verificación (cron): el dueño de la
  tienda tiene que volver a tocar "Verificar" después de cargar el TXT, o
  el super admin lo marca a mano desde el override.
