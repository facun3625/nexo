# Geolocalización de visitas (país/ciudad)

`/platform/trafico` muestra país y ciudad de quien visita urbi.com.ar,
resuelto contra una base de datos local (**GeoLite2-City**, de MaxMind) —
ninguna IP de un visitante viaja a un tercero.

## Cómo funciona

- `src/lib/site-visit.ts` guarda la IP de cada visita (`SiteVisit.ip`).
- `src/lib/ip-geo.ts` abre `data/GeoLite2-City.mmdb` una sola vez (queda en
  memoria) y resuelve país/ciudad por IP.
- `src/lib/site-visit-stats.ts` hace el lookup solo una vez por IP distinta
  (no una vez por visita) y arma los desgloses "Por país" / "Por ciudad"
  que se ven en el panel.
- El parseo pasa al mostrar las estadísticas, no al guardar la visita —
  así una base de datos más nueva mejora los datos ya guardados, sin
  reprocesar nada.

## Cuenta de MaxMind

- Cuenta gratuita creada en maxmind.com (uso: analítica interna propia).
- **Account ID**: `1406597`
- **License key**: guardada en `.env` como `MAXMIND_LICENSE_KEY` (no se
  repite acá — está en el `.env` del proyecto, tanto local como en el VPS).

## Actualizar la base de datos

MaxMind actualiza GeoLite2-City cada semana. El archivo local **no se
actualiza solo** — conviene bajarlo de nuevo cada 1-2 meses:

```bash
bash scripts/update-geolite2.sh
```

Este script lee `MAXMIND_ACCOUNT_ID` y `MAXMIND_LICENSE_KEY` de `.env`,
descarga la última versión y la deja en `data/GeoLite2-City.mmdb`.

Correrlo tanto en local como en el VPS (`/root/urbi/urbi`) — el archivo no
viaja por git (pesa ~70MB, está en `.gitignore`), así que hay que bajarlo
en cada lugar donde corre la app.

## Variables de entorno necesarias

En `.env` (local y VPS):

```
MAXMIND_ACCOUNT_ID=1406597
MAXMIND_LICENSE_KEY=<la license key>
```

## Privacidad

- La IP es el único dato de `SiteVisit` que identifica de verdad a
  alguien (a diferencia de la cookie anónima `urbi_vid` o el user-agent).
- En el panel solo se muestra **agregado** ("Argentina: 12 visitas"),
  nunca la IP cruda de una visita puntual.
- El lookup es 100% local (archivo en el propio servidor) — no se manda
  ninguna IP a un servicio externo para esto.
