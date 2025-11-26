import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPlanes, createPlan, updatePlan, deletePlan } from '../services/planes';

export default function GestionPlanes() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    duracion: '',
    precio: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    setLoading(true);
    try {
      const data = await listPlanes();
      setPlanes(data.data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      setError('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre || !formData.duracion || !formData.precio) {
      setError('Por favor completa todos los campos');
      return;
    }

    const duracion = parseInt(formData.duracion);
    const precio = parseFloat(formData.precio);

    if (duracion <= 0) {
      setError('La duración debe ser mayor a 0');
      return;
    }

    if (precio <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, formData.nombre, duracion, precio);
        setSuccess('Plan actualizado correctamente');
      } else {
        await createPlan(formData.nombre, duracion, precio);
        setSuccess('Plan creado correctamente');
      }
      setShowForm(false);
      setEditingPlan(null);
      setFormData({ nombre: '', duracion: '', precio: '' });
      await loadPlanes();
    } catch (err) {
      console.error('Error al guardar plan:', err);
      setError(err.response?.data?.error || 'Error al guardar plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      duracion: String(plan.duracion),
      precio: String(plan.precio)
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este plan? Los socios que lo usen no se verán afectados, pero no podrás asignarlo a nuevos socios.')) {
      return;
    }

    try {
      await deletePlan(id);
      setSuccess('Plan eliminado correctamente');
      await loadPlanes();
    } catch (err) {
      console.error('Error al eliminar plan:', err);
      setError(err.response?.data?.error || 'Error al eliminar plan');
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
        <h1 className="text-2xl font-bold">Gestion de Planes</h1>
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

      {!showForm ? (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingPlan(null);
                setFormData({ nombre: '', duracion: '', precio: '' });
                setError('');
                setSuccess('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo Plan
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Duracion (dias)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Precio</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {planes.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{plan.nombre}</td>
                    <td className="px-4 py-3">{plan.duracion}</td>
                    <td className="px-4 py-3">${plan.precio.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duracion (dias) *</label>
              <input
                type="number"
                min="1"
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingPlan ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPlan(null);
                  setFormData({ nombre: '', duracion: '', precio: '' });
                  setError('');
                  setSuccess('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

