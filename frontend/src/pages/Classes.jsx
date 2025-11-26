import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listClasses, cancelClass } from '../services/classes';
import ClassForm from '../components/ClassForm';
import ReserveButton from '../components/ReserveButton';

export default function Classes() {
  const { user } = useAuth();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filters, setFilters] = useState({ puedoInscribirme: false });
  const [allClases, setAllClases] = useState([]);

  const isAdmin = user?.rol === 'admin' || user?.rol === 'root';

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (filters.puedoInscribirme) {
      // Filtrar clases activas con cupo disponible
      const clasesDisponibles = allClases.filter(clase => 
        clase.estado === 'activa' && (clase.ocupados || 0) < clase.cupo
      );
      setClases(clasesDisponibles);
    } else {
      // Mostrar todas las clases
      setClases(allClases);
    }
  }, [filters.puedoInscribirme, allClases]);

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



