import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getConfiguracion,
  updateConfiguracion,
  actualizarEstadoSocios,
  getEstadoSociosCronConfig,
  updateEstadoSociosCronConfig,
} from '../services/configuracion';

export default function ConfiguracionGym() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    horarios_lunes_viernes: '',
    horarios_sabado: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [cronConfig, setCronConfig] = useState({ frecuencia: 'diario', hora: '00:00', activo: 1 });
  const [cronLoading, setCronLoading] = useState(true);
  const [cronSaving, setCronSaving] = useState(false);
  const [jobRunning, setJobRunning] = useState(false);
  const [jobResult, setJobResult] = useState(null);

  useEffect(() => {
    loadConfiguracion();
    loadCronConfig();
  }, []);

  const loadConfiguracion = async () => {
    setLoading(true);
    try {
      const data = await getConfiguracion();
      if (data.data) {
        setFormData({
          nombre: data.data.nombre || '',
          telefono: data.data.telefono || '',
          email: data.data.email || '',
          horarios_lunes_viernes: data.data.horarios_lunes_viernes || '',
          horarios_sabado: data.data.horarios_sabado || ''
        });
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadCronConfig = async () => {
    setCronLoading(true);
    try {
      const data = await getEstadoSociosCronConfig();
      if (data.data) {
        setCronConfig({
          frecuencia: data.data.frecuencia || 'diario',
          hora: data.data.hora || '00:00',
          activo: data.data.activo !== undefined ? data.data.activo : 1,
        });
      }
    } catch (err) {
      console.error('Error al cargar config cron:', err);
    } finally {
      setCronLoading(false);
    }
  };

  const handleRunJob = async () => {
    setError('');
    setSuccess('');
    setJobResult(null);
    setJobRunning(true);
    try {
      const data = await actualizarEstadoSocios();
      setJobResult(data.data);
      setSuccess(`Se actualizaron ${data.data.actualizados} de ${data.data.total} socios.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar estado de socios');
    } finally {
      setJobRunning(false);
    }
  };

  const handleSaveCronConfig = async () => {
    setError('');
    setSuccess('');
    setCronSaving(true);
    try {
      await updateEstadoSociosCronConfig({
        frecuencia: cronConfig.frecuencia,
        hora: cronConfig.hora,
        activo: cronConfig.activo ? 1 : 0,
      });
      setSuccess('Configuración del cron guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la configuración del cron');
    } finally {
      setCronSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!formData.nombre) {
      setError('El nombre del gimnasio es requerido');
      setSaving(false);
      return;
    }

    try {
      await updateConfiguracion(formData);
      setSuccess('Configuración actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuracion del Gimnasio</h1>
        <button
          onClick={() => navigate('/root')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Volver
        </button>
      </div>

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

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Gimnasio *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="381 000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email de Contacto</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="fitsense@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Horarios Lunes a Viernes</label>
            <input
              type="text"
              value={formData.horarios_lunes_viernes}
              onChange={(e) => setFormData({ ...formData, horarios_lunes_viernes: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Lunes a viernes: 7:00 a 23:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Horarios Sabado</label>
            <input
              type="text"
              value={formData.horarios_sabado}
              onChange={(e) => setFormData({ ...formData, horarios_sabado: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Sabados: 8:00 a 20:00"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Configuracion'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/root')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-semibold mb-4">Actualización de estado de socios</h2>
        <p className="text-sm text-gray-600 mb-4">
          Actualiza el estado de todos los socios (activo/inactivo/abandono) según pagos y vencimientos. Es la misma verificación que se hace cuando un socio inicia sesión.
        </p>
        <div className="mb-6">
          <button
            type="button"
            onClick={handleRunJob}
            disabled={jobRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {jobRunning ? 'Ejecutando...' : 'Actualizar estado de todos los socios'}
          </button>
          {jobResult && (
            <p className="mt-2 text-sm text-gray-600">
              Última ejecución: {jobResult.actualizados} actualizados de {jobResult.total} socios.
            </p>
          )}
        </div>

        <h3 className="text-lg font-medium mb-3">Programación automática</h3>
        {cronLoading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cron-activo"
                checked={!!cronConfig.activo}
                onChange={(e) => setCronConfig({ ...cronConfig, activo: e.target.checked ? 1 : 0 })}
                className="rounded"
              />
              <label htmlFor="cron-activo" className="text-sm font-medium">
                Activar actualización automática
              </label>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium mb-1">Frecuencia</label>
                <select
                  value={cronConfig.frecuencia}
                  onChange={(e) => setCronConfig({ ...cronConfig, frecuencia: e.target.value })}
                  className="border rounded px-3 py-2"
                >
                  <option value="diario">Diario</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora</label>
                <input
                  type="time"
                  value={cronConfig.hora}
                  onChange={(e) => setCronConfig({ ...cronConfig, hora: e.target.value })}
                  className="border rounded px-3 py-2"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveCronConfig}
              disabled={cronSaving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {cronSaving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



