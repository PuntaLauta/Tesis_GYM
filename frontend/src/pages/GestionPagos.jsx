import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listSocios } from '../services/socios';
import { createPayment } from '../services/pagos';

export default function GestionPagos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [formData, setFormData] = useState({
    socio_id: '',
    monto: '',
    metodo_pago: 'efectivo'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSocios();
  }, []);

  useEffect(() => {
    // Si viene un socio_id desde el estado de navegación, preseleccionarlo
    if (location.state?.socio_id && socios.length > 0) {
      const socioId = location.state.socio_id;
      const socio = socios.find(s => s.id === socioId);
      if (socio) {
        setSelectedSocio(socio);
        setFormData({
          socio_id: String(socioId),
          monto: socio.plan_precio || '',
          metodo_pago: 'efectivo'
        });
      }
    }
  }, [location.state, socios]);

  const loadSocios = async () => {
    setLoading(true);
    try {
      const data = await listSocios();
      setSocios(data.data || []);
    } catch (error) {
      console.error('Error al cargar socios:', error);
      setError('Error al cargar socios');
    } finally {
      setLoading(false);
    }
  };

  const handleSocioChange = (e) => {
    const socioId = e.target.value;
    const socio = socios.find(s => s.id === parseInt(socioId));
    setSelectedSocio(socio);
    setFormData({ ...formData, socio_id: socioId });
    
    // Si el socio tiene un plan, sugerir el monto del plan
    if (socio && socio.plan_precio) {
      setFormData({ ...formData, socio_id: socioId, monto: socio.plan_precio });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!formData.socio_id || !formData.monto || !formData.metodo_pago) {
        setError('Por favor completa todos los campos');
        setSaving(false);
        return;
      }

      const montoNum = parseFloat(formData.monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        setError('El monto debe ser un número válido mayor a 0');
        setSaving(false);
        return;
      }

      await createPayment(
        parseInt(formData.socio_id),
        montoNum,
        formData.metodo_pago
      );

      setSuccess('Pago registrado correctamente. La fecha de vencimiento ha sido actualizada.');
      setFormData({
        socio_id: '',
        monto: '',
        metodo_pago: 'efectivo'
      });
      setSelectedSocio(null);
      
      // Recargar socios para ver los cambios
      await loadSocios();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error al registrar pago:', err);
      setError(err.response?.data?.error || 'Error al registrar el pago');
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
        <h1 className="text-2xl font-bold">Gestionar Pagos</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Volver al Dashboard
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
        <h2 className="text-xl font-semibold mb-4">Registrar Nuevo Pago</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Socio *
            </label>
            <select
              value={formData.socio_id}
              onChange={handleSocioChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- Selecciona un socio --</option>
              {socios.map((socio) => (
                <option key={socio.id} value={socio.id}>
                  {socio.nombre} {socio.plan_nombre ? `- ${socio.plan_nombre}` : '(Sin plan)'}
                </option>
              ))}
            </select>
            {selectedSocio && selectedSocio.plan_nombre && (
              <p className="text-xs text-gray-500 mt-1">
                Plan: {selectedSocio.plan_nombre}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
              required
            />
            {selectedSocio && selectedSocio.plan_nombre && (
              <p className="text-xs text-gray-500 mt-1">
                Precio sugerido del plan: ${selectedSocio.plan_precio || 'N/A'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago *
            </label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Efectivo o transferencia, consultar en recepción
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Registrando...' : 'Registrar Pago'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  socio_id: '',
                  monto: '',
                  metodo_pago: 'efectivo'
                });
                setSelectedSocio(null);
                setError('');
                setSuccess('');
              }}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

