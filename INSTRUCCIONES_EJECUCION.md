# 🚀 Instrucciones de Ejecución - Gestión GYM
## 📋 Pasos para Ejecutar el Proyecto

### 1️⃣ Backend

```bash
# Ir a la carpeta backend
cd backend

# Instalar dependencias (solo la primera vez)
npm install

# Crear usuarios demo (solo la primera vez, o cuando quieras resetear)
npm run seed

# Iniciar el servidor
npm run dev
```

El backend estará corriendo en: **http://localhost:3001**

**Nota:** El archivo `.env` es opcional. Si no existe, el servidor usa valores por defecto:
- PORT=3001
- SESSION_SECRET=mi-secreto-super-seguro
- CORS_ORIGIN=http://localhost:5173

Si quieres crear un `.env` personalizado, copia este contenido:

```env
PORT=3001
SESSION_SECRET=mi-secreto-super-seguro-cambiar-en-produccion
CORS_ORIGIN=http://localhost:5173
```

### 2️⃣ Frontend

**En otra terminal** (deja el backend corriendo):

```bash
# Ir a la carpeta frontend
cd frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará corriendo en: **http://localhost:5173**

---

## 👤 Usuarios Demo

Una vez ejecutado `npm run seed` en el backend, tendrás estos usuarios:

| Email | Contraseña | Rol | Socio asociado |
|-------|------------|-----|----------------|
| juan@clientes.com | juan123 | cliente | Juan Pérez |
| maria@clientes.com | maria123 | cliente | María González |
| carlos@clientes.com | carlos123 | cliente | Carlos Rodríguez |
| admin@demo.com | admin123 | admin | — |
| root@demo.com | root123 | root | — |

---

## 📋 Socios Demo (IDs para pruebas)

El seed también crea socios de ejemplo con diferentes estados:

| ID | Nombre | Estado | Plan | Acceso | Para probar |
|----|--------|--------|------|--------|-------------|
| **1** | Juan Pérez | activo | Mensual | ✅ Permitido | Socio activo con pago reciente |
| **2** | María González | activo | Mensual | ✅ Permitido | Socio activo (pago hace 15 días) |
| **3** | Carlos Rodríguez | inactivo | Mensual | ❌ Denegado | Socio con membresía vencida |
| **4** | Ana Martínez | activo | Trimestral | ✅ Permitido | Socio con plan trimestral |
| **5** | Pedro Sánchez | activo | Sin plan | ❌ Denegado | Socio sin plan asignado |

**Usa estos IDs para probar:**
- Control de acceso (`/access`)
- Reservas para socios
- Reportes de activos/inactivos

---

## ✅ Verificación

1. **Backend funcionando:**
   - Abre: http://localhost:3001/api/health
   - Debe mostrar: `{"ok":true}`

2. **Frontend funcionando:**
   - Abre: http://localhost:5173
   - Debes ver la página de inicio

3. **Login:**
   - Ve a http://localhost:5173/login
   - Ingresa con cualquier usuario demo
   - Debes ser redirigido según tu rol

---

## 🔧 Comandos Útiles

### Backend
- `npm run dev` - Inicia servidor con nodemon (auto-reload)
- `npm start` - Inicia servidor sin auto-reload
- `npm run seed` - Crea/actualiza usuarios demo

### Frontend
- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Previsualiza build de producción

---

## 🗑️ Limpieza (Opcional)

Si quieres eliminar archivos de versiones anteriores:

```bash
# Eliminar carpeta apps/ (versión anterior con Prisma)
# Solo si estás seguro de que no la necesitas
rm -r apps/  # Linux/Mac
# o
rmdir /s apps\  # Windows CMD
# o
Remove-Item -Recurse -Force apps\  # Windows PowerShell
```

**⚠️ No es necesario eliminarlos para que el proyecto funcione.**

---

## 🐛 Problemas Comunes

### "Cannot find module 'dotenv'"
**Solución:** Ejecuta `npm install` en la carpeta backend

### "Port 3001 already in use"
**Solución:** 
- Cierra el proceso que está usando el puerto 3001
- O cambia el PORT en el archivo `.env`

### "Port 5173 already in use"
**Solución:**
- Cierra el proceso que está usando el puerto 5173
- O cambia el puerto en `vite.config.js`

### "Error al iniciar sesión"
**Solución:**
- Verifica que el backend esté corriendo
- Verifica que hayas ejecutado `npm run seed`
- Verifica las credenciales (usar usuarios demo)

---

## 📝 Notas

- El backend crea automáticamente la base de datos `gym.db` al iniciar
- Las sesiones se mantienen mientras el servidor esté activo
- Si reinicias el backend, las sesiones se pierden (debes volver a loguearte)

---

## 🆕 Sprint 2 - Nuevas Funcionalidades

### 📚 Módulos Agregados

#### 1. Clases & Reservas
- **Ruta:** `/classes`
- **Funcionalidad:**
  - Ver clases disponibles con cupo y ocupación
  - Crear/editar/cancelar clases (admin/root)
  - Reservar clases (todos los usuarios autenticados)
  - Ver mis reservas (clientes)
  - Gestionar reservas (admin/root)

#### 2. Control de Acceso
- **Ruta:** `/access` (solo admin/root)
- **Funcionalidad:**
  - Registrar ingreso de socios
  - Validar membresía activa según pagos y planes
  - Mostrar resultado: Permitido ✅ o Denegado ❌

#### 3. Reportes
- **Ruta:** `/reports` (solo admin/root)
- **Funcionalidad:**
  - Socios activos vs inactivos
  - Socios que vencen en 7 días
  - Ingresos por período
  - Ocupación de clases

### 🔗 Nuevas Rutas Frontend

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/classes` | Todos autenticados | Ver y gestionar clases |
| `/reservations` | Todos autenticados | Ver reservas (mis reservas si eres cliente) |
| `/access` | Admin/Root | Control de acceso al gimnasio |
| `/reports` | Admin/Root | Reportes y estadísticas |

### 📡 Nuevos Endpoints Backend

#### Clases
- `GET /api/clases` - Listar clases (con filtros: desde, hasta, estado)
- `GET /api/clases/:id` - Detalle de clase con ocupación
- `POST /api/clases` - Crear clase (admin/root)
- `PUT /api/clases/:id` - Editar clase (admin/root)
- `DELETE /api/clases/:id` - Cancelar clase (admin/root)

#### Reservas
- `GET /api/reservas?clase_id=ID` - Listar reservas de una clase (admin/root)
- `GET /api/reservas/mias` - Mis reservas (cliente)
- `POST /api/reservas` - Crear reserva
- `PUT /api/reservas/:id/cancelar` - Cancelar reserva
- `PUT /api/reservas/:id/asistencia` - Marcar asistencia (admin/root)

#### Accesos
- `POST /api/accesos` - Registrar acceso (admin/root)
  - Body: `{ socio_id: 1 }`
  - Retorna: `{ permitido: true/false, motivo: "..." }`

#### Reportes
- `GET /api/reportes/activos_inactivos` - Contador de activos/inactivos
- `GET /api/reportes/vencen_semana` - Socios que vencen en 7 días
- `GET /api/reportes/ingresos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` - Ingresos por período
- `GET /api/reportes/ocupacion_clases?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` - Ocupación de clases

### 🧪 Cómo Probar las Nuevas Funcionalidades

#### 1. Clases
1. Inicia sesión como admin o root
2. Ve a `/classes`
3. Crea una nueva clase
4. Como cliente, ve a `/classes` y reserva una clase
5. Verifica que el cupo se actualice

#### 2. Reservas
1. Como cliente: Ve a `/reservations` para ver tus reservas
2. Como admin: Ve a `/reservations`, filtra por clase y gestiona reservas
3. Marca asistencia/ausente desde el panel de admin

#### 3. Control de Acceso
1. Inicia sesión como admin o root
2. Ve a `/access`
3. Prueba con diferentes IDs de socios:
   - ID 1, 2, 4 → Deberían dar "Permitido ✅"
   - ID 3, 5 → Deberían dar "Denegado ❌"

#### 4. Reportes
1. Inicia sesión como admin o root
2. Ve a `/reports`
3. Revisa las estadísticas:
   - Tarjetas de activos/inactivos
   - Lista de vencimientos
   - Ingresos por período
   - Ocupación de clases

### 📊 Datos de Ejemplo

El seed crea automáticamente:
- **3 clases de ejemplo** (Yoga, Crossfit, Spinning)
- **5 socios de ejemplo** (con diferentes estados)
- **2 planes** (Mensual 30 días, Trimestral 90 días)
- **Pagos de ejemplo** para cada socio

### 🔄 Reiniciar después de cambios

Si agregaste nuevas funcionalidades o cambiaste el código:

1. **Backend:** Detén (Ctrl+C) y reinicia `npm run dev`
2. **Frontend:** Detén (Ctrl+C) y reinicia `npm run dev`

Esto asegura que:
- Las nuevas rutas se carguen correctamente
- Las nuevas tablas se creen si no existen
- Los componentes nuevos se registren en React Router

