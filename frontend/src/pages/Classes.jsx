import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listClasses, cancelClass } from '../services/classes';
import { listTiposClase } from '../services/tipoClase';
import ClassForm from '../components/ClassForm';
import ReserveButton from '../components/ReserveButton';

export default function Classes() {
  const { user } = useAuth();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filters, setFilters] = useState({ puedoInscribirme: false, tipo_clase_id: '' });
  const [allClases, setAllClases] = useState([]);
  const [tiposClase, setTiposClase] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const isAdmin = user?.rol === 'admin' || user?.rol === 'root';

  useEffect(() => {
    loadClasses();
    loadTiposClase();
  }, []);

  useEffect(() => {
    let filtered = allClases;

    if (filters.puedoInscribirme) {
      // Filtrar clases activas con cupo disponible
      filtered = filtered.filter(clase => 
        clase.estado === 'activa' && (clase.ocupados || 0) < clase.cupo
      );
    }

    if (filters.tipo_clase_id) {
      // Filtrar por tipo de clase
      filtered = filtered.filter(clase => 
        clase.tipo_clase_id === parseInt(filters.tipo_clase_id)
      );
    }

    setClases(filtered);
  }, [filters, allClases]);

  const loadTiposClase = async () => {
    try {
      const data = await listTiposClase();
      setTiposClase(data.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de clase:', error);
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await listClasses({});
      const clasesData = data.data || [];
      setAllClases(clasesData);
      setClases(clasesData);
    } catch (error) {
      console.error('Error al cargar clases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async (id) => {
    if (!confirm('¿Estás seguro de cancelar esta clase? Se cancelarán todas las reservas activas.')) {
      return;
    }

    try {
      await cancelClass(id);
      loadClasses();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cancelar clase');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingClass(null);
    loadClasses();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clases</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingClass(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Nueva Clase'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="font-bold mb-4">{editingClass ? 'Editar' : 'Nueva'} Clase</h2>
          <ClassForm
            clase={editingClass}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingClass(null);
            }}
          />
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-semibold mb-3">Filtros</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="puedoInscribirme"
                checked={filters.puedoInscribirme}
                onChange={(e) => setFilters({ ...filters, puedoInscribirme: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="puedoInscribirme" className="text-sm cursor-pointer">
                Me puedo inscribir
              </label>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Tipo de Clase</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm || (tiposClase.find(t => t.id === parseInt(filters.tipo_clase_id))?.nombre || '')}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  placeholder="Buscar tipo de clase..."
                  className="w-full border rounded px-3 py-2"
                />
                {showDropdown && tiposClase.filter(tipo =>
                  tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                ).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                    <div
                      onClick={() => {
                        setFilters({ ...filters, tipo_clase_id: '' });
                        setSearchTerm('');
                        setShowDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium text-gray-500">Todos los tipos</div>
                    </div>
                    {tiposClase.filter(tipo =>
                      tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((tipo) => (
                      <div
                        key={tipo.id}
                        onClick={() => {
                          setFilters({ ...filters, tipo_clase_id: tipo.id });
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
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {clases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay clases disponibles</div>
          ) : (
            clases.map((clase) => (
              <div key={clase.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{clase.nombre}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {clase.fecha} • {clase.hora_inicio} - {clase.hora_fin}
                    </div>
                    {clase.instructor && (
                      <div className="text-sm text-gray-600">Instructor: {clase.instructor}</div>
                    )}
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        clase.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {clase.estado}
                      </span>
                      <span className="ml-2 text-sm">
                        Ocupación: {clase.ocupados || 0}/{clase.cupo} ({clase.porcentaje || 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {clase.estado === 'activa' && (
                      <ReserveButton clase={clase} onSuccess={loadClasses} />
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setEditingClass(clase);
                            setShowForm(true);
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          Editar
                        </button>
                        {clase.estado === 'activa' && (
                          <button
                            onClick={() => handleCancelClass(clase.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Cancelar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}



