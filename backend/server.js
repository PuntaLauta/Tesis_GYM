require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

// Inicializar base de datos (ejecuta init.sql automáticamente)
const { dbPromise } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Configurar sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mi-secreto-super-seguro',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true en producción con HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Rutas
app.use('/auth', require('./routes/auth'));
app.use('/api/socios', require('./routes/socios'));
app.use('/api/planes', require('./routes/planes'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/clases', require('./routes/clases'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/accesos', require('./routes/accesos'));
app.use('/api/access', require('./routes/accesos')); // Alias para rutas de acceso por token
app.use('/api/reportes', require('./routes/reportes'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor después de inicializar la base de datos
dbPromise.then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch((error) => {
  console.error('Error al inicializar base de datos:', error);
  process.exit(1);
});

