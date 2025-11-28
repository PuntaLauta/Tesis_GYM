import { useState, useEffect } from 'react';
import { createClass, updateClass } from '../services/classes';
import { listTiposClase } from '../services/tipoClase';
import { listInstructores } from '../services/instructores';

export default function ClassForm({ clase, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    tipo_clase_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    cupo: '',
    instructor_id: '',
  });
  const [tiposClase, setTiposClase] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTiposClase();
    loadInstructores();
  }, []);

  useEffect(() => {
    if (clase) {
      setFormData({
        tipo_clase_id: clase.tipo_clase_id || '',
        fecha: clase.fecha || '',
        hora_inicio: clase.hora_inicio || '',
        hora_fin: clase.hora_fin || '',
        cupo: clase.cupo || '',
        instructor_id: clase.instructor_id || '',
      });
    }
  }, [clase]);

  const loadTiposClase = async () => {
    try {
      const data = await listTiposClase();
      setTiposClase(data.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de clase:', error);
    }
  };

  const loadInstructores = async () => {
    try {
      const data = await listInstructores();
      setInstructores(data.data || []);
    } catch (error) {
      console.error('Error al cargar instructores:', error);
    }
  };

  const filteredTipos = tiposClase.filter(tipo =>
    tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTipo = tiposClase.find(t => t.id === parseInt(formData.tipo_clase_id));

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
      
      <div className="relative">
        <label className="block text-sm font-medium mb-1">Tipo de Clase</label>
        <div className="relative">
          <input
            type="text"
            required
            value={searchTerm || (selectedTipo ? selectedTipo.nombre : '')}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Delay para permitir click en dropdown
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder="Buscar tipo de clase..."
            className="w-full border rounded px-3 py-2"
          />
          {showDropdown && filteredTipos.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
              {filteredTipos.map((tipo) => (
                <div
                  key={tipo.id}
                  onClick={() => {
                    setFormData({ ...formData, tipo_clase_id: tipo.id });
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{tipo.nombre}</div>
                  {tipo.descripcion && (
                    <div className="text-sm text-gray-600">{tipo.descripcion}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="hidden"
          value={formData.tipo_clase_id}
          required
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
        <select
          value={formData.instructor_id}
          onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Sin instructor</option>
          {instructores
            .filter(i => i.activo === 1)
            .map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.nombre}
              </option>
            ))}
        </select>
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



