#!/bin/bash
# Deploy de Nexo Inmobiliaria en el VPS. Correr desde /root/nexo/nexo:
#   bash deploy.sh
set -e

echo "== git pull =="
# El build en .next-build agrega sus rutas de tipos a tsconfig.json; ese
# cambio local haría fallar el pull, así que se descarta antes.
git checkout -- tsconfig.json 2>/dev/null || true
git pull origin main

echo "== npm install =="
npm install

echo "== prisma migrate deploy =="
npx prisma migrate deploy

echo "== prisma generate =="
npx prisma generate

echo "== build en paralelo (la tienda sigue arriba con el build anterior) =="
rm -rf .next-build
# tsconfig incluye .next/types: son los tipos del build que está corriendo y
# todavía referencian rutas que este deploy pudo haber borrado (pasó con
# /emprendimientos → "Cannot find module"). El servidor no los usa en
# runtime, así que se pueden borrar sin cortar el sitio.
rm -rf .next/types .next/dev/types
NEXT_DIST_DIR=.next-build npm run build

echo "== reemplazar build y reiniciar =="
rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-build .next
pm2 restart nexo
rm -rf .next-old

echo "== listo — últimas líneas del log =="
sleep 2
pm2 logs nexo --lines 15 --nostream
