-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('cliente', 'admin', 'root'))
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
  telefono TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'suspendido', 'inactivo')),
  plan_id INTEGER,
  usuario_id INTEGER,
  qr_token TEXT UNIQUE,
  FOREIGN KEY (plan_id) REFERENCES planes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL,
  monto REAL NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (socio_id) REFERENCES socios(id)
);

-- Tabla de clases
CREATE TABLE IF NOT EXISTS clases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  cupo INTEGER NOT NULL,
  instructor TEXT,
  estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'cancelada'))
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
