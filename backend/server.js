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
app.use('/api/configuracion', require('./routes/configuracion'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/backup', require('./routes/backup'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Configurar tarea programada para backups automáticos
let cronJob = null;

async function configurarBackupsAutomaticos() {
  try {
    const cron = require('node-cron');
    const { get } = require('./db/database');
    const { crearBackup, limpiarBackupsAntiguos } = require('./db/backup');
    
    const config = get('SELECT * FROM backup_config WHERE id = 1');
    
    if (!config || !config.activo) {
      console.log('⚠️ Backups automáticos desactivados');
      return;
    }
    
    // Detener tarea anterior si existe
    if (cronJob) {
      cronJob.stop();
    }
    
    // Determinar cron schedule según frecuencia
    let schedule = '';
    const [hora, minuto] = (config.hora || '02:00').split(':');
    
    switch (config.frecuencia) {
      case 'diario':
        schedule = `${minuto} ${hora} * * *`; // Diario a la hora configurada
        break;
      case 'semanal':
        schedule = `${minuto} ${hora} * * 0`; // Domingos a la hora configurada
        break;
      case 'mensual':
        schedule = `${minuto} ${hora} 1 * *`; // Día 1 de cada mes
        break;
      default:
        schedule = `${minuto} ${hora} * * *`; // Por defecto diario
    }
    
    // Crear tarea programada
    cronJob = cron.schedule(schedule, () => {
      try {
        console.log('🔄 Iniciando backup automático...');
        crearBackup('automatic');
        console.log('✅ Backup automático completado');
        
        // Limpiar backups antiguos
        const eliminados = limpiarBackupsAntiguos(config.mantener_backups || 30);
        if (eliminados > 0) {
          console.log(`🗑️ Se eliminaron ${eliminados} backups antiguos`);
        }
      } catch (error) {
        console.error('❌ Error en backup automático:', error);
      }
    });
    
    console.log(`✅ Backups automáticos configurados: ${config.frecuencia} a las ${config.hora}`);
  } catch (error) {
    console.error('⚠️ Error al configurar backups automáticos:', error.message);
    console.log('   Asegúrate de tener node-cron instalado: npm install node-cron');
  }
}

// Iniciar servidor después de inicializar la base de datos
dbPromise.then(() => {
  // Configurar backups automáticos
  configurarBackupsAutomaticos();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch((error) => {
  console.error('Error al inicializar base de datos:', error);
  process.exit(1);
});

