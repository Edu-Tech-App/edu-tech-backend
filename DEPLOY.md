# Despliegue — Edu-Tech Backend

Backend **NestJS + TypeORM + MySQL** desplegado con CI/CD.

## Arquitectura

```
GitHub (push a main) ──► GitHub Actions (build + test) ──► Render (backend) ──► Aiven (MySQL, SSL)
                              │ si el CI pasa, dispara el Deploy Hook ▲
                              └──────────────────────────────────────┘
```

- **Aiven** → base de datos MySQL gestionada (plan gratis, conexión por SSL).
- **Render** → hospeda el backend NestJS (plan gratis).
- **GitHub Actions** → pipeline CI/CD: compila, prueba y, si todo pasa, dispara el deploy en Render.

---

## 1. Base de datos en Aiven

1. [Aiven Console](https://console.aiven.io/) → **Create service** → **MySQL** → plan **Free**.
2. Elige nube/región y un nombre (ej. `edu-tech-db`) → **Create service**.
3. Espera a que el estado sea **Running**.
4. En **Connection information** copia: `Host`, `Port`, `User` (avnadmin), `Password` y `Database` (`defaultdb`).

> Las tablas se crean solas en el primer arranque porque TypeORM tiene `synchronize: true`.

---

## 2. Web Service en Render

1. [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service** → conecta el repo `Edu-Tech-App/edu-tech-backend`, rama `main`.
2. Configuración:
   - **Runtime:** Node
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Instance Type:** Free
3. **Auto-Deploy: Off** (Settings → Build & Deploy). El deploy lo controla GitHub Actions, no Render.
4. **Environment Variables** (pestaña Environment):

   | Clave | Valor |
   |---|---|
   | `DB_HOST` | host de Aiven |
   | `DB_PORT` | puerto de Aiven |
   | `DB_USER` | `avnadmin` |
   | `DB_PASSWORD` | contraseña de Aiven |
   | `DB_NAME` | `defaultdb` |
   | `DB_SSL` | `true` |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | un secreto largo y aleatorio |
   | `JWT_EXPIRES_IN` | `30m` |
   | `MAIL_HOST` | `smtp.gmail.com` |
   | `MAIL_PORT` | `587` |
   | `MAIL_USER` | correo emisor |
   | `MAIL_PASS` | app password de Gmail |

   > **No** definas `PORT`: Render lo inyecta automáticamente y el código ya lo lee con `process.env.PORT`.
5. **Create Web Service** (hará un primer deploy).
6. Copia la URL del **Deploy Hook**: Settings → **Deploy Hook**.

---

## 3. Secret en GitHub

1. Repo en GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Nombre: `RENDER_DEPLOY_HOOK_URL` — Valor: la URL del Deploy Hook de Render.

---

## 4. Probar el CI/CD

Cada `push` a `main` ejecuta el workflow `.github/workflows/ci-cd.yml`:
1. Instala dependencias, lint (informativo), compila y corre los tests unitarios.
2. Si todo pasa, dispara el Deploy Hook → Render redepliega con la última versión.

La API queda disponible en `https://<tu-servicio>.onrender.com` y la documentación Swagger en `https://<tu-servicio>.onrender.com/api`.
