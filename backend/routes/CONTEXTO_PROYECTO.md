# 📋 Contexto del Proyecto - Sistema de Gestión de Gimnasio

Este documento contiene toda la información clave del proyecto para mantener el contexto en nuevas sesiones de Cursor y evitar pérdidas de información.

---

## 🏗️ Arquitectura y Stack Tecnológico

### Backend
- **Framework**: Express.js (Node.js)
- **Base de Datos**: SQLite usando `sql.js` (base de datos en memoria que se persiste en archivo)
- **Autenticación**: Express-session (sesiones basadas en cookies)
- **Seguridad**: bcrypt para hashing de contraseñas
- **Tareas Programadas**: node-cron para backups automáticos
- **QR Codes**: qrcode para generar códigos QR de acceso
- **Puerto**: 3001 (configurable con variable de entorno)

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.0
- **Routing**: React Router DOM 6.26.0
- **HTTP Client**: Axios 1.7.2
- **Estilos**: Tailwind CSS 3.4.13
- **Puerto**: 5173 (Vite dev server)

---

## 📁 Estructura del Proyecto

```
TESIS/
├── backend/
│   ├── db/
│   │   ├── database.js          # Configuración y helpers de SQLite
│   │   ├── init.sql             # Esquema de base de datos
│   │   ├── gym.db               # Base de datos SQLite (generada automáticamente)
│   │   ├── backup.js            # Funciones de backup/restore
│   │   └── backups/             # Carpeta de backups
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación y roles
│   ├── routes/                  # Rutas de la API
│   │   ├── auth.js              # Login, logout, recuperación de contraseña
│   │   ├── socios.js            # CRUD de socios
│   │   ├── planes.js            # CRUD de planes
│   │   ├── pagos.js             # Gestión de pagos
│   │   ├── clases.js            # CRUD de clases
│   │   ├── reservas.js          # Gestión de reservas
│   │   ├── accesos.js           # Control de acceso por QR/token
│   │   ├── reportes.js          # Reportes y estadísticas
│   │   ├── configuracion.js     # Configuración del gimnasio
│   │   ├── usuarios.js          # Gestión de usuarios (admin/root)
│   │   └── backup.js             # Endpoints de backup/restore
│   ├── models/
│   │   └── helpers.js           # Funciones auxiliares
│   ├── server.js                # Punto de entrada del servidor
│   ├── seed.js                  # Script para datos demo
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/          # Componentes reutilizables
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── RoleRoute.jsx
    │   │   ├── AccessForm.jsx
    │   │   ├── ClassForm.jsx
    │   │   ├── ReserveButton.jsx
    │   │   ├── SocioQrCard.jsx
    │   │   ├── StatCards.jsx
    │   │   └── QuickActions.jsx
    │   ├── pages/                # Páginas principales
    │   │   ├── Login.jsx
    │   │   ├── Home.jsx
    │   │   ├── DashboardAdmin.jsx
    │   │   ├── DashboardRoot.jsx
    │   │   ├── Socios.jsx
    │   │   ├── Classes.jsx
    │   │   ├── Reservations.jsx
    │   │   ├── AccessControl.jsx
    │   │   ├── GestionPagos.jsx
    │   │   ├── GestionPlanes.jsx
    │   │   ├── GestionAdmins.jsx
    │   │   ├── Reports.jsx
    │   │   ├── ConfiguracionGym.jsx
    │   │   ├── Backup.jsx
    │   │   ├── Profile.jsx
    │   │   └── ForgotPassword.jsx
    │   ├── services/             # Servicios de API
    │   │   ├── api.js            # Configuración de Axios
    │   │   ├── auth.js
    │   │   ├── socios.js
    │   │   ├── planes.js
    │   │   ├── pagos.js
    │   │   ├── classes.js
    │   │   ├── reservations.js
    │   │   ├── access.js
    │   │   ├── reports.js
    │   │   ├── configuracion.js
    │   │   ├── usuarios.js
    │   │   └── backup.js
    │   ├── context/
    │   │   └── AuthContext.jsx  # Contexto de autenticación
    │   ├── App.jsx               # Componente principal con rutas
    │   ├── main.jsx              # Punto de entrada
    │   └── index.css
    ├── index.html
    └── package.json
```

---

## 🗄️ Base de Datos - Esquema Completo

### Tablas Principales

#### `usuarios`
- `id` (INTEGER PRIMARY KEY)
- `nombre` (TEXT NOT NULL)
- `email` (TEXT UNIQUE NOT NULL)
- `pass_hash` (TEXT NOT NULL) - Contraseña hasheada con bcrypt
- `rol` (TEXT NOT NULL) - Valores: 'cliente', 'admin', 'root'

#### `socios`
- `id` (INTEGER PRIMARY KEY)
- `nombre` (TEXT NOT NULL)
- `documento` (TEXT) - DNI del socio (único)
- `telefono` (TEXT)
- `estado` (TEXT NOT NULL DEFAULT 'activo') - Valores: 'activo', 'suspendido', 'inactivo'
- `cancelado_por_admin` (INTEGER NOT NULL DEFAULT 0) - 0 = no cancelado, 1 = cancelado manualmente por admin
- `plan_id` (INTEGER) - FK a planes
- `usuario_id` (INTEGER) - FK a usuarios (opcional, para login)
- `qr_token` (TEXT UNIQUE) - Token de 6 dígitos para QR
- `notas` (TEXT) - Notas sobre el socio (máximo 50 caracteres)

**Índices:**
- `idx_socios_documento` - Único en documento

#### `planes`
- `id` (INTEGER PRIMARY KEY)
- `nombre` (TEXT NOT NULL)
- `duracion` (INTEGER NOT NULL) - Días de duración
- `precio` (REAL NOT NULL)

#### `pagos`
- `id` (INTEGER PRIMARY KEY)
- `socio_id` (INTEGER NOT NULL) - FK a socios
- `monto` (REAL NOT NULL)
- `fecha` (TEXT NOT NULL DEFAULT datetime('now'))
- `metodo_pago` (TEXT) - Valores: 'efectivo', 'tarjeta', 'transferencia', 'otro'

#### `clases`
- `id` (INTEGER PRIMARY KEY)
- `nombre` (TEXT NOT NULL)
- `fecha` (TEXT NOT NULL) - Formato: 'YYYY-MM-DD'
- `hora_inicio` (TEXT NOT NULL) - Formato: 'HH:MM'
- `hora_fin` (TEXT NOT NULL) - Formato: 'HH:MM'
- `cupo` (INTEGER NOT NULL)
- `instructor` (TEXT)
- `estado` (TEXT DEFAULT 'activa') - Valores: 'activa', 'cancelada'

#### `reservas`
- `id` (INTEGER PRIMARY KEY)
- `clase_id` (INTEGER NOT NULL) - FK a clases
- `socio_id` (INTEGER NOT NULL) - FK a socios
- `estado` (TEXT NOT NULL DEFAULT 'reservado') - Valores: 'reservado', 'cancelado', 'asistio', 'ausente'
- `ts` (TEXT DEFAULT datetime('now'))
- **UNIQUE** (clase_id, socio_id) - Un socio no puede reservar dos veces la misma clase

#### `accesos`
- `id` (INTEGER PRIMARY KEY)
- `socio_id` (INTEGER NOT NULL) - FK a socios
- `fecha_hora` (TEXT DEFAULT datetime('now'))
- `permitido` (INTEGER NOT NULL) - 0 = denegado, 1 = permitido
- `motivo` (TEXT) - Razón del acceso/denegación

#### `preguntas_seguridad`
- `id` (INTEGER PRIMARY KEY)
- `usuario_id` (INTEGER NOT NULL UNIQUE) - FK a usuarios
- `pregunta` (TEXT NOT NULL)
- `respuesta_hash` (TEXT NOT NULL) - Respuesta hasheada con bcrypt

#### `configuracion_gym`
- `id` (INTEGER PRIMARY KEY CHECK(id = 1)) - Solo un registro
- `nombre` (TEXT NOT NULL DEFAULT 'Gimnasio')
- `telefono` (TEXT)
- `email` (TEXT)
- `horarios_lunes_viernes` (TEXT)
- `horarios_sabado` (TEXT)

#### `backup_config`
- `id` (INTEGER PRIMARY KEY DEFAULT 1) - Solo un registro
- `frecuencia` (TEXT) - Valores: 'diario', 'semanal', 'mensual'
- `hora` (TEXT) - Formato: 'HH:MM'
- `mantener_backups` (INTEGER DEFAULT 30) - Días a mantener
- `activo` (INTEGER DEFAULT 1) - 0 = desactivado, 1 = activo

---

## 🔐 Sistema de Autenticación y Roles

### Roles
1. **cliente**: Acceso limitado a su propia información
   - Ver sus reservas
   - Ver su perfil
   - Ver sus pagos
   - Reservar/cancelar clases
   - Configurar pregunta de seguridad

2. **admin**: Gestión operativa
   - Todo lo de cliente
   - Gestión de socios
   - Gestión de clases
   - Gestión de reservas
   - Control de acceso
   - Gestión de pagos
   - Ver reportes

3. **root**: Acceso completo
   - Todo lo de admin
   - Gestión de administradores
   - Gestión de planes
   - Configuración del gimnasio
   - Backups y restauración

### Middleware de Autenticación
- `requireAuth`: Requiere que el usuario esté autenticado
- `requireRole(...roles)`: Requiere que el usuario tenga uno de los roles especificados
- Ubicación: `backend/middleware/auth.js`

### Sesiones
- Almacenadas en memoria del servidor (express-session)
- Cookie httpOnly, no secure (cambiar a true en producción con HTTPS)
- Duración: 24 horas
- Se pierden al reiniciar el servidor

---

## 🛣️ Rutas de la API

### Autenticación (`/auth`)
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/me` - Obtener usuario actual
- `POST /auth/forgot-password` - Solicitar recuperación
- `POST /auth/reset-password` - Restablecer contraseña
- `POST /auth/set-security-question` - Configurar pregunta de seguridad

### Socios (`/api/socios`)
- `GET /api/socios` - Listar socios (con filtros opcionales)
- `GET /api/socios/:id` - Obtener socio por ID
- `POST /api/socios` - Crear socio (admin/root)
- `PUT /api/socios/:id` - Actualizar socio (admin/root)
- `DELETE /api/socios/:id` - Eliminar socio (admin/root)
- `GET /api/socios/:id/qr.png` - Descargar QR del socio
- `POST /api/socios/:id/qr/rotate` - Regenerar token QR

### Planes (`/api/planes`)
- `GET /api/planes` - Listar planes
- `POST /api/planes` - Crear plan (root)
- `PUT /api/planes/:id` - Actualizar plan (root)
- `DELETE /api/planes/:id` - Eliminar plan (root)

### Pagos (`/api/pagos`)
- `GET /api/pagos` - Listar pagos (con filtros)
- `POST /api/pagos` - Crear pago (admin/root)
- `GET /api/pagos/mine` - Mis pagos (cliente)

### Clases (`/api/clases`)
- `GET /api/clases` - Listar clases (con filtros de fecha)
- `GET /api/clases/:id` - Obtener clase por ID
- `POST /api/clases` - Crear clase (admin/root)
- `PUT /api/clases/:id` - Actualizar clase (admin/root)
- `DELETE /api/clases/:id` - Eliminar clase (admin/root)

### Reservas (`/api/reservas`)
- `GET /api/reservas` - Listar reservas (con filtros)
- `GET /api/reservas/mine` - Mis reservas (cliente)
- `POST /api/reservas` - Crear reserva
- `PUT /api/reservas/:id` - Actualizar reserva (cancelar, marcar asistencia)
- `DELETE /api/reservas/:id` - Eliminar reserva

### Accesos (`/api/accesos` y `/api/access`)
- `GET /api/accesos` - Listar accesos (con filtros)
- `POST /api/accesos` - Registrar acceso por ID de socio
- `GET /api/access/verify?token=XXX` - Verificar token QR
- `POST /api/access/enter?token=XXX` - Registrar acceso por token QR

### Reportes (`/api/reportes`)
- `GET /api/reportes/activos_inactivos` - Estadísticas de socios activos/inactivos
- `GET /api/reportes/vencen_semana` - Socios que vencen esta semana
- `GET /api/reportes/ingresos` - Reporte de ingresos (con filtros de fecha)
- `GET /api/reportes/ocupacion_clases` - Ocupación de clases (con filtros)
- `GET /api/reportes/accesos` - Reporte de accesos (con filtros)
- `GET /api/reportes/metodos_pago` - Métodos de pago utilizados
- `GET /api/reportes/socios_activos` - Top socios más activos
- `GET /api/reportes/clases_populares` - Clases más populares
- `GET /api/reportes/export/:tipo` - Exportar reporte a CSV

### Configuración (`/api/configuracion`)
- `GET /api/configuracion` - Obtener configuración
- `PUT /api/configuracion` - Actualizar configuración (root)

### Usuarios (`/api/usuarios`)
- `GET /api/usuarios` - Listar usuarios (root)
- `POST /api/usuarios` - Crear usuario (root)
- `PUT /api/usuarios/:id` - Actualizar usuario (root)
- `DELETE /api/usuarios/:id` - Eliminar usuario (root)
- `POST /api/usuarios/:id/change-password` - Cambiar contraseña (root)

### Backups (`/api/backup`)
- `GET /api/backup` - Listar backups
- `POST /api/backup` - Crear backup manual
- `POST /api/backup/restore/:filename` - Restaurar backup
- `DELETE /api/backup/:filename` - Eliminar backup
- `GET /api/backup/config` - Obtener configuración de backups
- `PUT /api/backup/config` - Actualizar configuración de backups (root)

---

## 🔑 Funcionalidades Clave

### 1. Control de Acceso por QR
- Cada socio tiene un `qr_token` único de 6 dígitos
- El QR se genera automáticamente al crear el socio
- El QR codifica: `http://localhost:3001/api/access/verify?token=<qr_token>`
- Se puede regenerar el token (rota el QR)
- El acceso se valida según:
  - Estado del socio (activo/inactivo/suspendido)
  - Vencimiento del plan (si tiene plan)
  - Estado de pagos

### 2. Sistema de Reservas
- Los clientes pueden reservar clases
- Un socio no puede reservar dos veces la misma clase (UNIQUE constraint)
- Estados: reservado, cancelado, asistio, ausente
- Los admins pueden marcar asistencia/ausencia

### 3. Gestión de Pagos
- Se registran pagos asociados a socios
- Métodos: efectivo, tarjeta, transferencia, otro
- Los pagos se usan para determinar vencimiento de planes

### 4. Recuperación de Contraseña
- Sistema de preguntas de seguridad
- Los clientes configuran su pregunta desde "Mi Perfil"
- Preguntas disponibles predefinidas
- Respuestas se almacenan hasheadas (bcrypt)
- Respuestas se normalizan (minúsculas, sin espacios)

### 5. Reportes y Exportación
- Múltiples reportes disponibles
- Exportación a CSV de todos los reportes
- Filtros por fecha en reportes de ingresos, ocupación y accesos

### 6. Backups Automáticos
- Configuración de frecuencia (diario, semanal, mensual)
- Hora configurable
- Limpieza automática de backups antiguos
- Backups manuales disponibles
- Restauración de backups

### 7. Notas en Socios
- Campo `notas` en tabla socios
- Máximo 50 caracteres
- Se muestra en listado y en formularios
- Columna compacta en tablas (max-width: 200px)

---

## 💻 Convenciones y Patrones de Código

### Backend
- **Base de datos**: Se usa `sql.js` con helpers en `database.js`
  - `get(query, params)` - Para SELECT que retorna un solo registro
  - `all(query, params)` - Para SELECT que retorna múltiples registros
  - `insert(query, params)` - Para INSERT/UPDATE/DELETE
  - `exec(query)` - Para queries que no retornan datos
- **Autenticación**: Se verifica con `req.session.user`
- **Errores**: Se retornan con formato `{ error: 'mensaje' }`
- **Éxito**: Se retornan con formato `{ data: ... }`
- **Validación**: Se hace en las rutas antes de interactuar con la BD

### Frontend
- **Servicios**: Cada módulo tiene su servicio en `src/services/`
- **Componentes**: Componentes reutilizables en `src/components/`
- **Páginas**: Páginas principales en `src/pages/`
- **Autenticación**: Se usa `AuthContext` para estado global
- **Rutas protegidas**: `ProtectedRoute` y `RoleRoute` para control de acceso
- **API**: Axios configurado con `withCredentials: true` para cookies
- **Autoscroll**: Implementado en formularios que se abren dinámicamente
  - IDs de formularios: `formulario-socio`, `formulario-plan`, `formulario-admin`
  - IDs de modales: `modal-password`
  - Se usa `scrollIntoView({ behavior: 'smooth', block: 'start' })`

### Validaciones Importantes
- **Documento y Teléfono**: Solo números (se filtra con `replace(/\D/g, '')`)
- **Notas**: Máximo 50 caracteres
- **Email**: Validación de formato y unicidad
- **Contraseñas**: Mínimo 6 caracteres
- **QR Token**: 6 dígitos únicos

---

## ⚙️ Configuración y Variables de Entorno

### Backend (.env)
```env
PORT=3001
SESSION_SECRET=mi-secreto-super-seguro
CORS_ORIGIN=http://localhost:5173
```

Si no existe `.env`, se usan estos valores por defecto.

### Frontend
- Base URL de API: `http://localhost:3001` (hardcodeado en `api.js`)
- Cambiar en producción según necesidad

---

## 🚀 Comandos Importantes

### Backend
```bash
cd backend
npm install              # Instalar dependencias
npm run dev              # Servidor con auto-reload (nodemon)
npm start                # Servidor sin auto-reload
npm run seed             # Crear/actualizar datos demo
```

### Frontend
```bash
cd frontend
npm install              # Instalar dependencias
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run preview          # Previsualizar build
```

### Dependencias Críticas
- **node-cron**: Necesario para backups automáticos. Si falta, ejecutar: `npm install node-cron` en backend

---

## 📝 Notas Importantes para Desarrollo

1. **Base de Datos**:
   - Se crea automáticamente en `backend/db/gym.db`
   - `init.sql` se ejecuta automáticamente al iniciar
   - Las migraciones se hacen manualmente (ALTER TABLE) o en `init.sql`

2. **Sesiones**:
   - Se pierden al reiniciar el servidor
   - En producción, considerar usar Redis o almacenamiento persistente

3. **CORS**:
   - Configurado para `http://localhost:5173` por defecto
   - Cambiar en producción

4. **Backups**:
   - Se guardan en `backend/db/backups/`
   - Subcarpetas: `manual/` y `automatic/`
   - Formato: `gym_backup_YYYY-MM-DDTHH-mm-ss.db`

5. **QR Codes**:
   - Se generan como imágenes PNG
   - Se descargan desde `/api/socios/:id/qr.png`
   - El token se puede rotar (regenerar)

6. **Exportación CSV**:
   - Endpoint: `/api/reportes/export/:tipo`
   - Tipos: `ingresos`, `ocupacion`, `accesos`, `metodos_pago`, `socios_activos`, `clases_populares`
   - Se descarga automáticamente en el navegador

7. **Autoscroll**:
   - Implementado en formularios de Socios, Planes y Administradores
   - Delay de 100ms para asegurar renderizado
   - Comportamiento suave (smooth)

8. **Validaciones de Campos**:
   - Documento y teléfono: solo números (filtrado automático)
   - Notas: máximo 50 caracteres
   - Email: validación de formato y unicidad

---

## 🐛 Problemas Conocidos y Soluciones

1. **Backend no arranca**:
   - Verificar que `node-cron` esté instalado: `npm install node-cron`
   - Verificar que la base de datos tenga permisos de escritura

2. **Sesiones se pierden**:
   - Normal si se reinicia el servidor (sesiones en memoria)
   - En producción, usar almacenamiento persistente

3. **CORS errors**:
   - Verificar que `CORS_ORIGIN` en `.env` coincida con la URL del frontend
   - Verificar que `withCredentials: true` esté en la configuración de Axios

4. **Notas no aparecen**:
   - Verificar que el campo `notas` esté en la tabla `socios`
   - Verificar que se esté enviando en el body de la petición
   - Verificar que el backend esté guardando el campo

---

## 📚 Archivos de Referencia Rápida

- **Esquema de BD**: `backend/db/init.sql`
- **Configuración de BD**: `backend/db/database.js`
- **Configuración de servidor**: `backend/server.js`
- **Middleware de auth**: `backend/middleware/auth.js`
- **Configuración de API**: `frontend/src/services/api.js`
- **Contexto de auth**: `frontend/src/context/AuthContext.jsx`
- **Rutas de la app**: `frontend/src/App.jsx`

---

## 🔄 Flujo de Trabajo Típico

1. **Agregar nueva funcionalidad**:
   - Crear/actualizar ruta en `backend/routes/`
   - Crear/actualizar servicio en `frontend/src/services/`
   - Crear/actualizar componente o página en `frontend/src/pages/`
   - Agregar ruta en `frontend/src/App.jsx` si es nueva página

2. **Modificar base de datos**:
   - Agregar ALTER TABLE en `init.sql` o ejecutar manualmente
   - Reiniciar backend para aplicar cambios

3. **Agregar validación**:
   - Backend: Validar en la ruta antes de procesar
   - Frontend: Validar en el formulario antes de enviar

4. **Agregar autoscroll**:
   - Agregar ID al formulario/modal
   - Agregar `setTimeout` con `scrollIntoView` al abrir

---

**Última actualización**: 2025-01-26
**Versión del proyecto**: 1.0.0

