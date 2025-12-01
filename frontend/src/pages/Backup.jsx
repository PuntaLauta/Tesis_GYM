import { useState, useEffect } from 'react';
import { listBackups, createBackup, restoreBackup, deleteBackup, getBackupConfig, updateBackupConfig } from '../services/backup';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [config, setConfig] = useState({
    frecuencia: 'diario',
    hora: '02:00',
    mantener_backups: 30,
    activo: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [backupsData, configData] = await Promise.all([
        listBackups(),
        getBackupConfig()
      ]);
      setBackups(backupsData.data || []);
      if (configData.data) {
        setConfig(configData.data);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await createBackup();
      setSuccess(`Backup creado: ${result.archivo}`);
      loadData();
    } catch (err) {
      console.error('Error al crear backup:', err);
      setError(err.response?.data?.error || 'Error al crear backup');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (nombre, tipo) => {
    if (!window.confirm(`¿Estás seguro de restaurar el backup "${nombre}"? Esto reemplazará la base de datos actual. Se creará un backup de seguridad antes de restaurar.`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await restoreBackup(nombre, tipo);
      setSuccess('Backup restaurado correctamente. Por favor, reinicia el servidor para aplicar los cambios.');
    } catch (err) {
      console.error('Error al restaurar backup:', err);
      setError(err.response?.data?.error || 'Error al restaurar backup');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nombre, tipo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el backup "${nombre}"?`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await deleteBackup(nombre, tipo);
      setSuccess('Backup eliminado correctamente');
      loadData();
    } catch (err) {
      console.error('Error al eliminar backup:', err);
      setError(err.response?.data?.error || 'Error al eliminar backup');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateBackupConfig(config);
      setSuccess('Configuración guardada correctamente');
      loadData();
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setError(err.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion de Backups</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Información sobre backups */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
        <h2 className="font-semibold text-blue-800 mb-2">¿Como funcionan los backups?</h2>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Backups Manuales:</strong> Puedes crear un backup en cualquier momento haciendo clic en "Crear Backup Manual".</p>
          <p><strong>Backups Automaticos:</strong> El sistema crea backups automaticamente segun la configuracion establecida (diario, semanal o mensual).</p>
          <p><strong>Frecuencia:</strong> Los backups automaticos se ejecutan a la hora configurada. Por defecto: diario a las 02:00.</p>
          <p><strong>Mantenimiento:</strong> Los backups mas antiguos que el periodo configurado se eliminan automaticamente para ahorrar espacio.</p>
          <p><strong>Restauracion:</strong> Al restaurar un backup, se crea automaticamente un backup de seguridad de la base de datos actual antes de restaurar.</p>
        </div>
      </div>

      {/* Configuración de backups automáticos */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuracion de Backups Automaticos</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={config.activo === 1}
              onChange={handleConfigChange}
              className="mr-2"
            />
            <label htmlFor="activo" className="text-sm font-medium">
              Activar backups automaticos
            </label>
          </div>

          {config.activo === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                <select
                  name="frecuencia"
                  value={config.frecuencia}
                  onChange={handleConfigChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal (Domingos)</option>
                  <option value="mensual">Mensual (Dia 1)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora (HH:MM)</label>
                <input
                  type="time"
                  name="hora"
                  value={config.hora}
                  onChange={handleConfigChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mantener backups por (dias)
                </label>
                <input
                  type="number"
                  name="mantener_backups"
                  value={config.mantener_backups}
                  onChange={handleConfigChange}
                  min="1"
                  max="365"
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los backups mas antiguos se eliminaran automaticamente
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
        </div>
      </div>

      {/* Crear backup manual */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Backup Manual</h2>
        <button
          onClick={handleCreateBackup}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Creando...' : 'Crear Backup Manual'}
        </button>
      </div>

      {/* Lista de backups */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Backups Disponibles</h2>
        {backups.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No hay backups disponibles</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Nombre</th>
                  <th className="text-left py-2 px-4">Tipo</th>
                  <th className="text-left py-2 px-4">Fecha</th>
                  <th className="text-left py-2 px-4">Tamaño</th>
                  <th className="text-left py-2 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={`${backup.tipo}-${backup.nombre}`} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{backup.nombre}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        backup.tipo === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.tipo === 'manual' ? 'Manual' : 'Automatico'}
                      </span>
                    </td>
                    <td className="py-2 px-4">{formatearFecha(backup.fecha)}</td>
                    <td className="py-2 px-4">{backup.tamañoFormateado}</td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() => handleRestore(backup.nombre, backup.tipo)}
                        disabled={saving}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleDelete(backup.nombre, backup.tipo)}
                        disabled={saving}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



