#!/usr/bin/env bash
#
# Da de alta en Nginx + Let's Encrypt cada dominio por el que se llega a una
# tienda: su subdominio (tienda.urbi.com.ar) y, si lo verificó por DNS desde
# su panel, también su dominio propio (moulinscocina.com.ar).
#
# Todos los certificados que emite usan desafío HTTP, así que se renuevan
# solos. Eso es lo que lo distingue del certificado wildcard *.urbi.com.ar,
# que se emitió con desafío DNS manual porque DonWeb no tiene plugin de
# certbot, y que por lo tanto hay que renovar a mano cada 90 días.
#
# Es idempotente: los dominios ya configurados se saltean, así que se puede
# correr cuantas veces se quiera (a mano o por cron).
#
#   ./scripts/provision-domains.sh              # da de alta lo que falte
#   ./scripts/provision-domains.sh --dry-run    # solo muestra qué haría
#
set -euo pipefail

# --- Configuración -----------------------------------------------------------
APP_PORT="${APP_PORT:-3014}"
ROOT_DOMAIN="${ROOT_DOMAIN:-urbi.com.ar}"
DB_CONTAINER="${DB_CONTAINER:-urbi-db}"
DB_USER="${DB_USER:-urbi_user}"
DB_NAME="${DB_NAME:-urbi_db}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-facundoarteagasola@gmail.com}"
WEBROOT="${WEBROOT:-/var/www/certbot}"
NGINX_AVAILABLE="${NGINX_AVAILABLE:-/etc/nginx/sites-available}"
NGINX_ENABLED="${NGINX_ENABLED:-/etc/nginx/sites-enabled}"
MAX_BODY="${MAX_BODY:-20M}"

# Marca para reconocer los archivos que generó este script y no pisar los
# que escribiste vos a mano.
MARKER="# generado por provision-domains.sh"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

log()  { printf '%s\n' "$*"; }
skip() { printf '  · %s\n' "$*"; }
ok()   { printf '  ✓ %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }

run() {
  if $DRY_RUN; then printf '  [dry-run] %s\n' "$*"; else eval "$@"; fi
}

# --- Chequeos previos --------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
  echo "Se necesita root (escribe en /etc/nginx y corre certbot). Usá sudo." >&2
  exit 1
fi

for cmd in docker certbot nginx dig; do
  command -v "$cmd" >/dev/null || { echo "Falta el comando: $cmd" >&2; exit 1; }
done

# IP pública de este servidor: sirve para no pedirle un certificado a un
# dominio que todavía no apunta acá (certbot fallaría y Let's Encrypt tiene
# límite de intentos por semana).
SERVER_IP="${SERVER_IP:-$(curl -fsS --max-time 10 https://api.ipify.org || true)}"
if [[ -z "$SERVER_IP" ]]; then
  echo "No pude determinar la IP pública. Pasala a mano: SERVER_IP=1.2.3.4 $0" >&2
  exit 1
fi
log "Servidor: $SERVER_IP   ·   app en localhost:$APP_PORT"
$DRY_RUN && log "(modo dry-run: no se cambia nada)"

mkdir -p "$WEBROOT"

# --- Dominios a atender ------------------------------------------------------
# Dos fuentes:
#   a) el subdominio de cada tienda (tienda.urbi.com.ar)
#   b) el dominio propio de las tiendas que ya lo verificaron por DNS
#
# Los subdominios los cubre hoy el certificado wildcard, pero ese wildcard se
# emitió con desafío DNS manual y NO se renueva solo (DonWeb no tiene plugin
# de certbot). Emitiendo un certificado por subdominio con desafío HTTP, cada
# tienda pasa a renovarse sola y desaparece esa dependencia manual.
#
# El techo es el límite de Let's Encrypt: 50 certificados nuevos por dominio
# registrado cada 7 días (~200 altas nuevas por mes). Las renovaciones no
# consumen cupo, así que el límite aplica solo a tiendas nuevas.
SQL_QUERY='
  SELECT subdomain || $$.'"$ROOT_DOMAIN"'$$ FROM "Tenant" WHERE subdomain IS NOT NULL
  UNION
  SELECT "customDomain" FROM "Tenant"
    WHERE "customDomainVerified" = true AND "customDomain" IS NOT NULL;
'
DOMAINS=$(docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "$SQL_QUERY" \
  | tr -d '\r' | sed '/^$/d')

if [[ -z "$DOMAINS" ]]; then
  log "No hay tiendas ni dominios propios. Nada que hacer."
  exit 0
fi

CHANGED=false

while IFS= read -r domain; do
  log ""
  log "→ $domain"

  conf="$NGINX_AVAILABLE/$domain"

  # Ya configurado por una corrida anterior (o a mano): no lo tocamos.
  if [[ -f "$conf" && -d "/etc/letsencrypt/live/$domain" ]]; then
    skip "ya configurado, se saltea"
    continue
  fi
  if [[ -f "$conf" ]] && ! grep -qF "$MARKER" "$conf" 2>/dev/null; then
    warn "existe $conf y no lo generó este script — lo dejo como está"
    continue
  fi

  # El dominio tiene que resolver a este servidor antes de pedir el cert.
  resolved=$(dig +short "$domain" A @8.8.8.8 | tail -1)
  if [[ "$resolved" != "$SERVER_IP" ]]; then
    warn "apunta a '${resolved:-nada}' y no a $SERVER_IP — lo salteo"
    continue
  fi

  # www solo tiene sentido en el dominio propio de una tienda, no en su
  # subdominio: a www.tienda.urbi.com.ar no entra nadie, y como el wildcard
  # de DNS igual lo resuelve, terminaría metido en el certificado sin
  # necesidad — y si algún día deja de resolver, hace fallar la renovación
  # del certificado entero.
  cert_args=(-d "$domain")
  server_names="$domain"
  www_resolved=""
  if [[ "$domain" != *".$ROOT_DOMAIN" ]]; then
    www_resolved=$(dig +short "www.$domain" A @8.8.8.8 | tail -1)
  fi
  if [[ -n "$www_resolved" && "$www_resolved" == "$SERVER_IP" ]]; then
    cert_args+=(-d "www.$domain")
    server_names="$domain www.$domain"
    ok "incluye www"
  fi

  # 1) Server block mínimo en HTTP: sirve el desafío ACME desde el webroot.
  #    Todavía sin SSL, porque el certificado no existe hasta el paso 2.
  if ! $DRY_RUN; then
    cat > "$conf" <<NGINX
$MARKER
server {
    listen 80;
    server_name $server_names;

    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    location / {
        return 301 https://\$host\$request_uri;
    }
}
NGINX
    ln -sf "$conf" "$NGINX_ENABLED/$domain"
    nginx -t >/dev/null 2>&1 || { warn "nginx -t falló con el block HTTP, abortando este dominio"; rm -f "$conf" "$NGINX_ENABLED/$domain"; continue; }
    systemctl reload nginx
  else
    log "  [dry-run] escribiría $conf (HTTP) y recargaría nginx"
  fi

  # 2) Certificado.
  if ! run certbot certonly --webroot -w "$WEBROOT" "${cert_args[@]}" \
        --non-interactive --agree-tos -m "$CERTBOT_EMAIL"; then
    warn "certbot falló para $domain — queda solo en HTTP, revisalo a mano"
    continue
  fi

  # 3) Server block definitivo, con SSL y proxy a la app.
  if ! $DRY_RUN; then
    cat > "$conf" <<NGINX
$MARKER
server {
    listen 80;
    server_name $server_names;

    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $server_names;

    ssl_certificate     /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        # Sin esto la app no sabe por qué dominio entró el visitante y no
        # puede resolver de qué tienda se trata (ver src/proxy.ts y
        # src/app/api/auth/[...nextauth]/route.ts).
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size $MAX_BODY;
}
NGINX
  else
    log "  [dry-run] escribiría $conf (HTTP+SSL)"
  fi

  CHANGED=true
  ok "listo"
done <<< "$DOMAINS"

# --- Aplicar -----------------------------------------------------------------
log ""
if ! $CHANGED; then
  log "Sin cambios."
  exit 0
fi

if $DRY_RUN; then
  log "[dry-run] acá validaría con 'nginx -t' y recargaría."
  exit 0
fi

if nginx -t; then
  systemctl reload nginx
  log "Nginx recargado."
else
  echo "nginx -t falló — NO se recargó. Revisá la config antes de seguir." >&2
  exit 1
fi
