# Gestión GYM

Sistema simple y funcional para gestión de gimnasio. Backend Express + SQLite (sql.js) con sesiones; Frontend React + Vite + Tailwind. Incluye login por roles, clases y reservas, control de acceso por QR, recuperación de contraseña con preguntas de seguridad y reportes básicos.

## 🧩 Clonar el repositorio

HTTPS
```bash
git clone https://github.com/PuntaLauta/Tesis_GYM.git
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

| Email | Contraseña | Rol | Socio asociado | Estado |
|-------|------------|-----|----------------|--------|
| juan@clientes.com | juan123 | cliente | Juan Pérez | ACTIVO |
| maria@clientes.com | maria123 | cliente | María González | ACTIVO |
| carlos@clientes.com | carlos123 | cliente | Carlos Rodríguez | INACTIVO |
| luis@clientes.com | luis123 | cliente | Luis Martínez | INACTIVO |
| admin@demo.com | admin123 | admin | — | — |
| root@demo.com | root123 | root | — | — |

### 🔐 Preguntas de Seguridad (Recuperación de Contraseña)
Los usuarios demo tienen preguntas de seguridad configuradas para probar la recuperación de contraseña:

| Email | Pregunta | Respuesta |
|-------|----------|-----------|
| juan@clientes.com | ¿Equipo de fútbol que seguís? | **boca** |
| maria@clientes.com | ¿Comida favorita? | **pizza** |
| carlos@clientes.com | ¿Ciudad donde naciste? | **cordoba** |
| luis@clientes.com | ¿Apellido de soltera de tu madre? | **gonzalez** |

**Nota:** Las respuestas son case-insensitive (no importan mayúsculas/minúsculas).

---

## 📋 Socios Demo (IDs para pruebas)

| ID | Nombre | Estado | Plan | Acceso | Para probar |
|----|--------|--------|------|--------|-------------|
| 1 | Juan Pérez | activo | Mensual | ✅ Permitido | Pago reciente |
| 2 | María González | activo | Mensual | ✅ Permitido | Pago hace 15 días |
| 3 | Carlos Rodríguez | inactivo | Mensual | ❌ Denegado | Membresía vencida |
| 4 | Luis Martínez | inactivo | Mensual | ❌ Denegado | Membresía vencida |

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

## 🔑 Recuperación de Contraseña
El sistema incluye recuperación de contraseña mediante preguntas de seguridad:

1. **Configurar pregunta de seguridad:**
   - Los clientes pueden configurar su pregunta desde "Mi Perfil" → "Pregunta de Seguridad"
   - Preguntas disponibles: Equipo de fútbol, Comida favorita, Ciudad donde naciste, Apellido de soltera de tu madre, Nombre de tu colegio primario, Nombre de tu mascota

2. **Recuperar contraseña:**
   - En la página de login, click en "¿Olvidaste tu contraseña?"
   - Ingresar email → Responder pregunta de seguridad → Establecer nueva contraseña

3. **Seguridad:**
   - Las respuestas se almacenan hasheadas (bcrypt)
   - Las respuestas se normalizan (minúsculas, sin espacios)
   - No se revela si un email existe o no en el sistema

---

## 📝 Notas
- La base se crea automáticamente en `backend/db/gym.db`.
- Las sesiones persisten mientras el servidor esté activo.
- Si reinicias el backend, deberás volver a iniciar sesión.
- **Importante:** Si actualizas el código, reinicia el backend para que se cree la tabla `preguntas_seguridad` (migración automática).

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
