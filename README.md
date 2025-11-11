# Gestión GYM

Sistema simple y funcional para gestión de gimnasio. Backend Express + SQLite (sql.js) con sesiones; Frontend React + Vite + Tailwind. Incluye login por roles, clases y reservas, control de acceso por QR y reportes básicos.

## 🧩 Clonar el repositorio

HTTPS
```bash
git clone https://github.com/PuntaLauta/Tesis_GYM.git
cd Tesis_GYM
```

SSH
```bash
git clone git@github.com:PuntaLauta/Tesis_GYM.git
cd Tesis_GYM
```

## 📦 Instalación y ejecución

### 1️⃣ Backend
```bash
cd backend
npm install
npm run seed   # crea usuarios y datos demo
npm run dev    # http://localhost:3001
```
Variables por defecto si no existe `.env`:
- PORT=3001
- SESSION_SECRET=mi-secreto-super-seguro
- CORS_ORIGIN=http://localhost:5173

### 2️⃣ Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

---

## 👤 Usuarios Demo
Una vez ejecutado `npm run seed` en el backend:

| Email | Contraseña | Rol | Socio asociado |
|-------|------------|-----|----------------|
| juan@clientes.com | juan123 | cliente | Juan Pérez |
| maria@clientes.com | maria123 | cliente | María González |
| carlos@clientes.com | carlos123 | cliente | Carlos Rodríguez |
| admin@demo.com | admin123 | admin | — |
| root@demo.com | root123 | root | — |

---

## 📋 Socios Demo (IDs para pruebas)

| ID | Nombre | Estado | Plan | Acceso | Para probar |
|----|--------|--------|------|--------|-------------|
| 1 | Juan Pérez | activo | Mensual | ✅ Permitido | Pago reciente |
| 2 | María González | activo | Mensual | ✅ Permitido | Pago hace 15 días |
| 3 | Carlos Rodríguez | inactivo | Mensual | ❌ Denegado | Membresía vencida |
| 4 | Ana Martínez | activo | Trimestral | ✅ Permitido | Plan trimestral |
| 5 | Pedro Sánchez | activo | — | ❌ Denegado | Sin plan |

---

## ✅ Verificación rápida
- Backend: `http://localhost:3001/api/health` → `{ "ok": true }`
- Frontend: `http://localhost:5173` → página de inicio
- Login: `http://localhost:5173/login` → redirección según rol

---

## 🔧 Comandos útiles
Backend
- `npm run dev`  → servidor con auto-reload
- `npm start`    → servidor sin auto-reload
- `npm run seed` → crear/actualizar datos demo

Frontend
- `npm run dev` → desarrollo
- `npm run build` → build producción
- `npm run preview` → previsualización

---

## 📝 Notas
- La base se crea automáticamente en `backend/db/gym.db`.
- Las sesiones persisten mientras el servidor esté activo.
- Si reinicias el backend, deberás volver a iniciar sesión.

---

## 🆕 Sprint 2 – Funcionalidades
- Clases y reservas (listado, creación/edición/cancelación; reserva y asistencia)
- Control de acceso por QR: verificación y registro por token
- Reportes: activos/inactivos, vencen en 7 días, ingresos por período, ocupación de clases

### Rutas Frontend
- `/classes`, `/reservations`, `/access` (admin/root), `/reports` (admin/root)

### Endpoints clave
- `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- Clases: `GET/POST/PUT/DELETE /api/clases`
- Reservas: `GET /api/reservas`, `GET /api/reservas/mias`, `POST /api/reservas`, `PUT /api/reservas/:id/*`
- Accesos: `POST /api/accesos`, `GET /api/access/verify?token=...`, `POST /api/access/enter`

---

## 🧪 Flujo QR (acceso)
- El QR codifica: `http://localhost:3001/api/access/verify?token=<qr_token>`
- En `/access` (admin/root): pega el token para Verificar/Registrar acceso.

---

## 🗂️ Estructura
```
/               # raíz del repositorio
├─ backend/     # Express + sql.js + sesiones
│  ├─ db/       # init.sql, gym.db, helpers
│  ├─ routes/   # auth, socios, planes, pagos, clases, reservas, accesos, reportes
│  └─ ...
└─ frontend/    # React + Vite + Tailwind
   └─ src/
      ├─ pages/ components/ services/ context/
      └─ App.jsx, etc.
```

---

## 🧭 Contribución
Rama de trabajo sugerida: `dev`. Crea PRs hacia `main`.

---

## 📎 Enlaces
- Repo: https://github.com/PuntaLauta/Tesis_GYM
