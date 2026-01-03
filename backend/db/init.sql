-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('cliente', 'admin', 'root', 'instructor'))
);

-- Tabla de planes
CREATE TABLE IF NOT EXISTS planes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  duracion INTEGER NOT NULL, -- días
  precio REAL NOT NULL
);

-- Tabla de socios
CREATE TABLE IF NOT EXISTS socios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  documento TEXT,
  telefono TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'suspendido', 'inactivo')),
  plan_id INTEGER,
  usuario_id INTEGER,
  qr_token TEXT UNIQUE,
  FOREIGN KEY (plan_id) REFERENCES planes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índice único para documento
CREATE UNIQUE INDEX IF NOT EXISTS idx_socios_documento ON socios(documento);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL,
  monto REAL NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (socio_id) REFERENCES socios(id)
);

CREATE TABLE IF NOT EXISTS tipo_clase (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT
);

-- Tabla de tipos de rutina (por ejemplo: fuerza, hipertrofia, full body, etc.)
CREATE TABLE IF NOT EXISTS tipo_rutina (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT
);

-- Tabla de instructores
CREATE TABLE IF NOT EXISTS instructores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  activo INTEGER DEFAULT 1 CHECK(activo IN (0, 1))
);

-- Tabla de clases
CREATE TABLE IF NOT EXISTS clases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_clase_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  cupo INTEGER NOT NULL,
  instructor TEXT,
  instructor_id INTEGER,
  estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'cancelada')),
  FOREIGN KEY (tipo_clase_id) REFERENCES tipo_clase(id),
  FOREIGN KEY (instructor_id) REFERENCES instructores(id)
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clase_id INTEGER NOT NULL,
  socio_id INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'reservado' CHECK(estado IN ('reservado', 'cancelado', 'asistio', 'ausente')),
  ts TEXT DEFAULT (datetime('now')),
  UNIQUE (clase_id, socio_id),
  FOREIGN KEY (clase_id) REFERENCES clases(id),
  FOREIGN KEY (socio_id) REFERENCES socios(id)
);

-- Tabla de accesos
CREATE TABLE IF NOT EXISTS accesos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL,
  fecha_hora TEXT DEFAULT (datetime('now')),
  permitido INTEGER NOT NULL CHECK(permitido IN (0, 1)),
  motivo TEXT,
  FOREIGN KEY (socio_id) REFERENCES socios(id)
);

-- Tabla de preguntas de seguridad
CREATE TABLE IF NOT EXISTS preguntas_seguridad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE,
  pregunta TEXT NOT NULL,
  respuesta_hash TEXT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de configuracion del gimnasio
CREATE TABLE IF NOT EXISTS configuracion_gym (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  nombre TEXT NOT NULL DEFAULT 'Gimnasio',
  telefono TEXT,
  email TEXT,
  horarios_lunes_viernes TEXT,
  horarios_sabado TEXT
);

-- Tabla de configuracion de backups
CREATE TABLE IF NOT EXISTS backup_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  frecuencia TEXT CHECK(frecuencia IN ('diario', 'semanal', 'mensual')),
  hora TEXT,
  mantener_backups INTEGER DEFAULT 30,
  activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rutinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL,
   tipo_rutina_id INTEGER,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ejercicios TEXT NOT NULL, -- JSON con array de ejercicios
  fecha_creacion TEXT DEFAULT (datetime('now')),
  fecha_inicio TEXT,
  fecha_fin TEXT,
  activa INTEGER DEFAULT 1 CHECK(activa IN (0, 1)),
  FOREIGN KEY (socio_id) REFERENCES socios(id),
  FOREIGN KEY (tipo_rutina_id) REFERENCES tipo_rutina(id)
);

-- Tabla de ejercicios base (catálogo general de ejercicios)
CREATE TABLE IF NOT EXISTS ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  series INTEGER,
  repeticiones TEXT,
  descripcion TEXT,
  estado_id INTEGER DEFAULT 1,
  descripcion_profesor TEXT,
  instructor_id INTEGER,
  FOREIGN KEY (estado_id) REFERENCES estado_ejercicios(id),
  FOREIGN KEY (instructor_id) REFERENCES instructores(id)
);

-- Tabla intermedia para relación muchos-a-muchos entre rutinas y ejercicios
CREATE TABLE IF NOT EXISTS rutina_ejercicio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rutina_id INTEGER NOT NULL,
  ejercicio_id INTEGER NOT NULL,
  series INTEGER,
  repeticiones TEXT,
  orden INTEGER,
  estado_id INTEGER DEFAULT 1,
  FOREIGN KEY (rutina_id) REFERENCES rutinas(id),
  FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id),
  FOREIGN KEY (estado_id) REFERENCES estado_ejercicios(id),
  UNIQUE(rutina_id, ejercicio_id)
);

-- Tabla para historial de conversaciones con el asistente
CREATE TABLE IF NOT EXISTS conversaciones_asistente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('rutina', 'ejercicio', 'asistencia', 'general')),
  mensaje_usuario TEXT NOT NULL,
  respuesta_asistente TEXT NOT NULL,
  metadata TEXT, -- JSON con info adicional
  fecha TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (socio_id) REFERENCES socios(id)
);

-- Tabla para ejercicios favoritos/guardados
CREATE TABLE IF NOT EXISTS ejercicios_favoritos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL,
  nombre_ejercicio TEXT NOT NULL,
  descripcion TEXT,
  musculos TEXT, -- JSON array de músculos trabajados
  fecha_guardado TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (socio_id) REFERENCES socios(id),
  UNIQUE(socio_id, nombre_ejercicio)
);

-- Tabla de estados de ejercicios
CREATE TABLE IF NOT EXISTS estado_ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- Insertar estados por defecto
INSERT OR IGNORE INTO estado_ejercicios (nombre, descripcion) VALUES 
  ('PENDIENTE', 'Pendiente de revisión por instructor'),
  ('APROBADO', 'Aprobado por instructor'),
  ('RECHAZADO', 'Rechazado por instructor');
