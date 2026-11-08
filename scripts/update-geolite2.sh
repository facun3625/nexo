#!/bin/bash
# Descarga (o actualiza) la base de datos GeoLite2-City que usa
# lib/ip-geo.ts para mostrar país/ciudad en /platform/trafico.
#
# Requiere MAXMIND_ACCOUNT_ID y MAXMIND_LICENSE_KEY en .env (cuenta
# gratuita en maxmind.com). MaxMind actualiza esta base cada semana —
# no hay nada automático que la refresque, correr este script de vez en
# cuando (cada 1-2 meses alcanza) para no quedar con datos viejos.
#
# Uso: bash scripts/update-geolite2.sh
set -e

cd "$(dirname "$0")/.."
set -a
source .env
set +a

if [ -z "$MAXMIND_ACCOUNT_ID" ] || [ -z "$MAXMIND_LICENSE_KEY" ]; then
  echo "Faltan MAXMIND_ACCOUNT_ID y/o MAXMIND_LICENSE_KEY en .env"
  exit 1
fi

mkdir -p data
tmpfile=$(mktemp)

echo "Descargando GeoLite2-City..."
curl -sS -L -u "$MAXMIND_ACCOUNT_ID:$MAXMIND_LICENSE_KEY" \
  "https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz" \
  -o "$tmpfile"

tmpdir=$(mktemp -d)
tar -xzf "$tmpfile" -C "$tmpdir"

mmdb=$(find "$tmpdir" -name "GeoLite2-City.mmdb" | head -1)
if [ -z "$mmdb" ]; then
  echo "No se encontró el archivo .mmdb dentro del descargado — revisá el account ID / license key."
  rm -rf "$tmpfile" "$tmpdir"
  exit 1
fi

mv "$mmdb" data/GeoLite2-City.mmdb
rm -rf "$tmpfile" "$tmpdir"

echo "Listo: data/GeoLite2-City.mmdb actualizado ($(date))."
