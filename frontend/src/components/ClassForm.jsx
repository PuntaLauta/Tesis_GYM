import { useState, useEffect } from 'react';
import { createClass, updateClass } from '../services/classes';

export default function ClassForm({ clase, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    cupo: '',
    instructor: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clase) {
      setFormData({
        nombre: clase.nombre || '',
        fecha: clase.fecha || '',
        hora_inicio: clase.hora_inicio || '',
        hora_fin: clase.hora_fin || '',
        cupo: clase.cupo || '',
        instructor: clase.instructor || '',
      });
    }
  }, [clase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (clase) {
        await updateClass(clase.id, formData);
      } else {
        await createClass(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar clase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          type="text"
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Fecha</label>
        <input
          type="date"
          required
          value={formData.fecha}
          onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Hora inicio</label>
          <input
            type="time"
            required
            value={formData.hora_inicio}
            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hora fin</label>
          <input
            type="time"
            required
            value={formData.hora_fin}
            onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cupo</label>
        <input
          type="number"
          required
          min="1"
          value={formData.cupo}
          onChange={(e) => setFormData({ ...formData, cupo: parseInt(e.target.value) })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Instructor</label>
        <input
          type="text"
          value={formData.instructor}
          onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : clase ? 'Actualizar' : 'Crear'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

