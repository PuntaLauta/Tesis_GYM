import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listClasses, cancelClass } from '../services/classes';
import { listTiposClase } from '../services/tipoClase';
import { listReservations, cancelReservation } from '../services/reservations';
import ClassForm from '../components/ClassForm';
import ReserveButton from '../components/ReserveButton';

export default function Classes() {
  const { user } = useAuth();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filters, setFilters] = useState({ puedoInscribirme: false, tipo_clase_id: '', fecha: '' });
  const [allClases, setAllClases] = useState([]);
  const [tiposClase, setTiposClase] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClaseForSocios, setSelectedClaseForSocios] = useState(null);
  const [sociosInscriptos, setSociosInscriptos] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(false);
  const [cardsToShow, setCardsToShow] = useState(10);

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

    if (filters.fecha) {
      // Filtrar por fecha
      filtered = filtered.filter(clase => 
        clase.fecha === filters.fecha
      );
    }

    setClases(filtered);
    setCardsToShow(10); // Resetear paginación cuando cambian los filtros
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

  const handleVerSocios = async (clase) => {
    setSelectedClaseForSocios(clase);
    setLoadingSocios(true);
    try {
      const data = await listReservations({ clase_id: clase.id });
      setSociosInscriptos(data.data || []);
    } catch (error) {
      console.error('Error al cargar socios:', error);
      alert('Error al cargar socios inscriptos');
    } finally {
      setLoadingSocios(false);
    }
  };

  const handleEliminarReserva = async (reservaId, socioNombre) => {
    if (!confirm(`¿Estás seguro de eliminar la reserva de ${socioNombre}?`)) {
      return;
    }

    try {
      await cancelReservation(reservaId);
      // Recargar la lista de socios
      if (selectedClaseForSocios) {
        const data = await listReservations({ clase_id: selectedClaseForSocios.id });
        setSociosInscriptos(data.data || []);
      }
      // Recargar clases para actualizar ocupación
      loadClasses();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar reserva');
    }
  };

  const clasesMostradas = clases.slice(0, cardsToShow);
  const hayMasClases = clases.length > cardsToShow;

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

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold mb-3">Filtros</h3>
        <div className="space-y-3">
          {!isAdmin && (
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
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Filtrar por fecha</label>
              <input
                type="date"
                value={filters.fecha}
                onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {clases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay clases disponibles</div>
          ) : (
            clasesMostradas.map((clase) => (
              <div key={clase.id} className="bg-white p-4 rounded-lg shadow w-full">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 w-full md:w-auto">
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
                  <div className="flex flex-col md:flex-row gap-2 items-end md:items-start ml-auto md:ml-4 w-full md:w-auto">
                    {clase.estado === 'activa' && (
                      <div className="w-full md:w-auto">
                        <ReserveButton clase={clase} onSuccess={loadClasses} />
                      </div>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleVerSocios(clase)}
                          className="w-full md:w-auto px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 whitespace-nowrap"
                        >
                          Ver socios
                        </button>
                        <button
                          onClick={() => {
                            setEditingClass(clase);
                            setShowForm(true);
                          }}
                          className="w-full md:w-auto px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 whitespace-nowrap"
                        >
                          Editar
                        </button>
                        {clase.estado === 'activa' && (
                          <button
                            onClick={() => handleCancelClass(clase.id)}
                            className="w-full md:w-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 whitespace-nowrap"
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
          {hayMasClases && (
            <div className="text-center py-4">
              <button
                onClick={() => setCardsToShow(cardsToShow + 5)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Ver más
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Socios Inscriptos */}
      {selectedClaseForSocios && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Socios Inscriptos</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedClaseForSocios.nombre} - {selectedClaseForSocios.fecha}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClaseForSocios(null);
                    setSociosInscriptos([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSocios ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : sociosInscriptos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay socios inscriptos en esta clase</div>
              ) : (
                <div className="space-y-3">
                  {sociosInscriptos.map((reserva) => (
                    <div key={reserva.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{reserva.socio_nombre}</div>
                        <div className="text-sm text-gray-600">
                          Documento: {reserva.socio_documento || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Estado: <span className={`px-2 py-1 rounded ${
                            reserva.estado === 'reservado' ? 'bg-blue-100 text-blue-800' :
                            reserva.estado === 'asistio' ? 'bg-green-100 text-green-800' :
                            reserva.estado === 'ausente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reserva.estado}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEliminarReserva(reserva.id, reserva.socio_nombre)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 whitespace-nowrap"
                      >
                        Eliminar reserva
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



