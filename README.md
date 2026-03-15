# Gestión GYM

Sistema simple y funcional para gestión de gimnasio. Backend Express + SQLite (sql.js) con sesiones; Frontend React + Vite + Tailwind. Incluye login por roles (cliente, admin, root, instructor), clases y reservas, control de acceso por QR, recuperación de contraseña con preguntas de seguridad, gestión de instructores y reportes básicos.

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

| Email | Contraseña | Rol | Socio asociado | Estado | Vencimiento |
|-------|------------|-----|----------------|--------|-------------|
| juan@clientes.com | juan123 | cliente | Juan Pérez | ACTIVO | — |
| maria@clientes.com | maria123 | cliente | María González | ACTIVO | En 3 días |
| carlos@clientes.com | carlos123 | cliente | Carlos Rodríguez | ACTIVO | En 5 días |
| luis@clientes.com | luis123 | cliente | Luis Martínez | INACTIVO | Vencido |
| ana@clientes.com | ana123 | cliente | Ana Martínez | ACTIVO | En 2 días |
| pedro@clientes.com | pedro123 | cliente | Pedro Sánchez | ACTIVO | En 7 días |
| laura@clientes.com | laura123 | cliente | Laura Fernández | ACTIVO | En 1 día |
| roberto@clientes.com | roberto123 | cliente | Roberto Díaz | ACTIVO | — |
| carmen@clientes.com | carmen123 | cliente | Carmen López | ACTIVO | En 4 días |
| miguel@clientes.com | miguel123 | cliente | Miguel Torres | INACTIVO | Vencido |
| admin@gym.com | admin123 | admin | — | — | — |
| root@gym.com | root123 | root | — | — | — |
| carlos@instructores.com | carlos123 | instructor | — | — | — |
| sofia@instructores.com | sofia123 | instructor | — | — | — |
| diego@instructores.com | diego123 | instructor | — | — | — |

### 🔐 Preguntas de Seguridad (Recuperación de Contraseña)
En los seeds, cada usuario recibe **una de 5 preguntas asignada al azar**. La respuesta válida es siempre la **palabra plana** asociada a esa pregunta (útil para desarrollo y pruebas):

| Pregunta (ejemplo) | Respuesta válida |
|--------------------|------------------|
| ¿En qué ciudad naciste? | **ciudad** |
| ¿Cuál es tu equipo de fútbol preferido? | **equipo** |
| ¿Cuál es tu película favorita? | **pelicula** |
| ¿A qué escuela primaria asististe? | **escuela** |
| ¿Cuál fue tu primer auto? | **auto** |

Al ejecutar `npm run seed`, cada usuario (root, admins, instructores, socios) tendrá una pregunta distinta asignada de forma aleatoria. Para recuperar contraseña en desarrollo, usa la respuesta plana que corresponda a la pregunta que se muestre en pantalla.

**Nota:** Las respuestas se almacenan hasheadas (bcrypt) y se normalizan (minúsculas, sin espacios) al verificar.

---

## 👨‍🏫 Instructores Demo
Los instructores pueden ver solo sus clases asignadas y los socios inscriptos en ellas:

| Email | Contraseña | Nombre | Clases asignadas |
|-------|------------|--------|-----------------|
| carlos@instructores.com | carlos123 | Carlos Mendoza | Crossfit |
| sofia@instructores.com | sofia123 | Sofía Ramírez | Zumba |
| diego@instructores.com | diego123 | Diego Torres | Funcional |

**Funcionalidades para instructores:**
- Dashboard personalizado con estadísticas de sus clases
- Ver todas sus clases (pasadas, presentes y futuras)
- Ver socios inscriptos en cada clase
- Solo pueden ver información, no editar

**Nota:** Los administradores pueden gestionar instructores desde `/admin/instructores` (crear, editar, eliminar y asignar a clases).

---

## 📋 Socios Demo
Todos los socios tienen credenciales para ingresar al sistema:

| ID | Nombre | Estado | Plan | Vencimiento | Acceso |
|----|--------|--------|------|-------------|--------|
| 1 | Juan Pérez | activo | Mensual | — | ✅ Permitido |
| 2 | María González | activo | Mensual | En 3 días | ✅ Permitido |
| 3 | Carlos Rodríguez | activo | Mensual | En 5 días | ✅ Permitido |
| 4 | Luis Martínez | inactivo | Mensual | Vencido | ❌ Denegado |
| 5 | Ana Martínez | activo | Mensual | En 2 días | ✅ Permitido |
| 6 | Pedro Sánchez | activo | Mensual | En 7 días | ✅ Permitido |
| 7 | Laura Fernández | activo | Mensual | En 1 día | ✅ Permitido |
| 8 | Roberto Díaz | activo | Mensual | — | ✅ Permitido |
| 9 | Carmen López | activo | Mensual | En 4 días | ✅ Permitido |
| 10 | Miguel Torres | inactivo | Mensual | Vencido | ❌ Denegado |

---

## ✅ Verificación rápida
- Backend: `http://localhost:3001/api/health` → `{ "ok": true }`
- Frontend: `http://localhost:5173` → página de inicio
- Login: `http://localhost:5173/login` → redirección según rol:
  - Cliente → `/` (Home)
  - Admin → `/admin` (Dashboard Admin)
  - Root → `/root` (Dashboard Root)
  - Instructor → `/instructor` (Dashboard Instructor)

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
   - Preguntas disponibles en el seed (asignadas al azar por usuario): ciudad de nacimiento, equipo de fútbol preferido, película favorita, escuela primaria a la que asistió, primer auto

2. **Recuperar contraseña:**
   - En la página de login, click en "¿Olvidaste tu contraseña?"
   - Ingresar email → Responder pregunta de seguridad (la palabra plana indicada arriba si usas datos del seed) → Establecer nueva contraseña

3. **Seguridad:**
   - Las respuestas se almacenan hasheadas (bcrypt)
   - Las respuestas se normalizan (minúsculas, sin espacios)
   - No se revela si un email existe o no en el sistema

---

## 📝 Notas
- La base se crea automáticamente en `backend/db/gym.db`.
- Las sesiones persisten mientras el servidor esté activo.
- Si reinicias el backend, deberás volver a iniciar sesión.
- **Importante:** Si actualizas el código o agregas nuevas funcionalidades (como instructores), reinicia el backend para que se ejecuten las migraciones automáticas:
  - Tabla `preguntas_seguridad`
  - Tabla `instructores`
  - Columna `instructor_id` en `clases`
  - Migración de datos existentes
- **Después de actualizar:** Ejecuta `npm run seed` para crear/actualizar los datos demo incluyendo instructores.

---

## 🧪 Flujo QR (acceso)
- El QR codifica: `http://localhost:3001/api/access/verify?token=<qr_token>`
- En `/access` (admin/root): pega el token para Verificar/Registrar acceso.

---

## 🗂️ Estructura
```
/               # raíz del repositorio
├─ backend/     # Express + sql.js + sesiones
│  ├─ db/       # init.sql, gym.db, helpers, migraciones
│  ├─ routes/   # auth, socios, planes, pagos, clases, reservas, accesos, reportes, instructores
│  └─ ...
└─ frontend/    # React + Vite + Tailwind
   └─ src/
      ├─ pages/     # DashboardAdmin, DashboardInstructor, GestionInstructores, etc.
      ├─ components/ # ClassForm, Navbar, etc.
      ├─ services/  # API calls (socios, clases, instructores, etc.)
      ├─ context/   # AuthContext
      └─ App.jsx, etc.
```

---

## 🧭 Contribución
Rama de trabajo sugerida: `dev`. Crea PRs hacia `main`.
