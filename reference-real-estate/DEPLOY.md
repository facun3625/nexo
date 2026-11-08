# Deploy — Penalva Inmobiliaria

## Servidor
- **VPS** con Nginx + PM2
- **Path:** `/var/www/penalva`
- **URL:** `https://app.penalvainmobiliaria.com.ar`
- **Proceso PM2:** `penalva` (id 5)
- **DB:** SQLite en `/var/www/penalva/prod.db`

---

## Deploy estándar (solo código)

```bash
cd /var/www/penalva
git pull
npm run build
pm2 restart penalva
```

---

## Deploy con cambios de DB (schema de Prisma)

Cuando se agregan modelos o campos nuevos al `prisma/schema.prisma`:

```bash
cd /var/www/penalva
git pull
DATABASE_URL="file:./prod.db" npx prisma db push
npm run build
pm2 restart penalva
```

---

## Deploy con dependencias nuevas

Cuando cambia el `package.json`:

```bash
cd /var/www/penalva
git pull
npm install
DATABASE_URL="file:./prod.db" npx prisma db push   # solo si hubo cambios de schema
npm run build
pm2 restart penalva
```

---

## Variables de entorno

Archivo: `/var/www/penalva/.env.local`

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | `file:./prod.db` |
| `JWT_SECRET` | Clave para firmar tokens JWT (sesión 8h) |
| `ADMIN_USERNAME` | Usuario del superadmin inicial |
| `ADMIN_PASSWORD` | Contraseña del superadmin inicial |
| `XAI_API_KEY` | API key de Groq (asistente Lena) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |

> Para editar: `nano /var/www/penalva/.env.local`
> Después de cambiar env vars, siempre hacer `pm2 restart penalva`.

---

## Comandos útiles de PM2

```bash
pm2 list                    # Ver todos los procesos
pm2 logs penalva            # Ver logs en tiempo real
pm2 logs penalva --lines 50 # Últimas 50 líneas de log
pm2 restart penalva         # Reiniciar
pm2 stop penalva            # Detener
pm2 start penalva           # Iniciar
pm2 env penalva             # Ver variables de entorno del proceso
```

---

## Si algo falla tras el deploy

```bash
# 1. Ver qué pasó
pm2 logs penalva --lines 100

# 2. Verificar que el build no tuvo errores
cd /var/www/penalva && npm run build

# 3. Verificar la DB
DATABASE_URL="file:./prod.db" npx prisma studio   # UI visual (corre en puerto 5555)

# 4. Rollback rápido
git log --oneline -10        # ver commits
git checkout <commit-hash>   # volver a una versión anterior
npm run build && pm2 restart penalva
```

---

## Flujo con cambios de hoy (referencia)

Los cambios del 2026-04-14 incluyeron nuevo modelo `AIInstruction` en la DB.
Ese fue el primer deploy que requirió `prisma db push` en prod.
