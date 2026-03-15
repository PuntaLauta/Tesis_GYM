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
Al ejecutar `npm run seed` se muestra en consola la seed usada (ej. `Seed actual: 12345`). La seed se configura en `backend/.env` con `DATA_SEED` (ver `backend/.env.example` o backend README): mismo valor en otra máquina genera los mismos datos.

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

| Rol | Email | Contraseña |
|-----|-------|------------|
| Socio (cliente) | socio1@gym.com … socio200@gym.com | socio123 |
| Root | root@gym.com | root123 |
| Admin | admin1@gym.com, admin2@gym.com, admin3@gym.com | admin123 |
| Instructor | instructor1@gym.com … instructor12@gym.com | instructor123 |

**Ejemplos por estado (para pruebas):**
- **Socios:** socio10@gym.com = Activo · socio1@gym.com = Inactivo · socio3@gym.com = Abandono · socio5@gym.com = Suspendido
- **Admins:** admin1@gym.com = Activo · admin3@gym.com = Inactivo.
- **Instructores:** instructor1@gym.com = Activo · instructor4@gym.com = Inactivo

Los nombres de admins, instructores y socios se generan con Faker. Si usas la misma `DATA_SEED` en `backend/.env`, obtienes los mismos datos (misma seed = mismos nombres y asignaciones). Para regenerar todo desde cero: `npm run clear:data` y luego `npm run seed` (desde la carpeta backend).

### 🔐 Preguntas de Seguridad (Recuperación de Contraseña)
En los seeds, cada usuario recibe **una de 5 preguntas asignada al azar**. La respuesta válida es siempre la **palabra plana** asociada a esa pregunta (útil para desarrollo y pruebas):

| Pregunta (ejemplo) | Respuesta válida |
|--------------------|------------------|
| ¿En qué ciudad naciste? | **ciudad** |
| ¿Cuál es tu equipo de fútbol preferido? | **equipo** |
| ¿Cuál es tu película favorita? | **pelicula** |
| ¿A qué escuela primaria asististe? | **escuela** |
| ¿Cuál fue tu primer auto? | **auto** |

Al ejecutar `npm run seed`, cada usuario (root, admins, instructores, socios) tendrá una pregunta asignada. Si usas `DATA_SEED` en `.env`, la asignación es determinista (misma seed = misma pregunta por email). Para recuperar contraseña en desarrollo, usa la respuesta plana que corresponda a la pregunta que se muestre en pantalla.

**Nota:** Las respuestas se almacenan hasheadas (bcrypt) y se normalizan (minúsculas, sin espacios) al verificar.

---

## 👨‍🏫 Instructores Demo
Se crean 12 instructores (instructor1@gym.com … instructor12@gym.com, contraseña `instructor123`). Los nombres se generan con Faker; al menos 3 pueden estar inactivos; las clases se asignan de forma aleatoria. Los instructores pueden ver solo sus clases asignadas y los socios inscriptos en ellas.

**Funcionalidades para instructores:**
- Dashboard personalizado con estadísticas de sus clases
- Ver todas sus clases (pasadas, presentes y futuras)
- Ver socios inscriptos en cada clase
- Solo pueden ver información, no editar

**Nota:** Los administradores pueden gestionar instructores desde `/admin/instructores` (crear, editar, eliminar y asignar a clases).

---

## 📋 Socios Demo
Se crean 200+ socios (socio1@gym.com … socio200@gym.com, contraseña `socio123`). Distribución aproximada: ~80% activo, 10% inactivo, 9% abandono, 1% suspendido. Los socios en estado activo tienen último pago y fecha recientes para que al iniciar sesión sigan activos (no pasen a inactivo por vencimiento). Parte de los socios tienen notas aleatorias. Planes y vencimiento dependen del plan asignado y de los pagos generados.

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
- `npm run seed` → crear/actualizar datos demo (muestra en consola el valor de `DATA_SEED` usado)
- `npm run clear:data` → limpia todos los datos (reservas, pagos, socios, usuarios, clases, etc.) sin borrar esquema ni tablas de catálogo; usar antes de `npm run seed` para regenerar todo desde cero

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
- **Datos de prueba:** La generación es configurable con `DATA_SEED` en `backend/.env` (ver backend README). Las fechas generadas no superan la fecha actual.
- **Importante:** Si actualizas el código o agregas nuevas funcionalidades (como instructores), reinicia el backend para que se ejecuten las migraciones automáticas:
  - Tabla `preguntas_seguridad`
  - Tabla `instructores`
  - Columna `instructor_id` en `clases`
  - Migración de datos existentes
- **Después de actualizar:** Ejecuta `npm run seed` para crear/actualizar los datos demo. Para empezar desde cero: `npm run clear:data` y luego `npm run seed`.

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
