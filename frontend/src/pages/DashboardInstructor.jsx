import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClasesInstructor, getSociosClase, getInstructor } from '../services/instructores';
import { cancelClass } from '../services/classes';

export default function DashboardInstructor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState(null);
  const [clases, setClases] = useState([]);
  const [clasesEstaSemana, setClasesEstaSemana] = useState([]);
  const [clasesProximas, setClasesProximas] = useState([]);
  const [tiposClaseAsignados, setTiposClaseAsignados] = useState([]);
  const [selectedClase, setSelectedClase] = useState(null);
  const [sociosInscriptos, setSociosInscriptos] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(false);
  const [stats, setStats] = useState({
    totalClases: 0,
    ocupacionPromedio: 0,
    clasesEsteMes: 0
  });

  useEffect(() => {
    if (user && user.instructor_id) {
      loadInstructor();
      loadClases();
    }
  }, [user]);

  const loadInstructor = async () => {
    if (!user || !user.instructor_id) return;
    
    try {
      const data = await getInstructor(user.instructor_id);
      setInstructor(data.data);
    } catch (error) {
      console.error('Error al cargar información del instructor:', error);
    }
  };

  const loadClases = async () => {
    if (!user || !user.instructor_id) return;
    
    setLoading(true);
    try {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      // Cargar todas las clases del instructor
      const todasLasClases = await getClasesInstructor(user.instructor_id, {});
      
      // Filtrar clases del mes actual
      const clasesEsteMes = todasLasClases.data.filter(clase => {
        const fechaClase = new Date(clase.fecha);
        return fechaClase >= inicioMes && fechaClase <= finMes;
      });

      // Calcular estadísticas
      const ocupacionTotal = todasLasClases.data.reduce((sum, clase) => sum + (clase.porcentaje || 0), 0);
      const ocupacionPromedio = todasLasClases.data.length > 0 
        ? Math.round(ocupacionTotal / todasLasClases.data.length) 
        : 0;

      setStats({
        totalClases: todasLasClases.data.length,
        ocupacionPromedio,
        clasesEsteMes: clasesEsteMes.length
      });

      // Extraer tipos de clase únicos asignados al instructor
      const tiposUnicos = [...new Set(todasLasClases.data
        .filter(c => c.nombre || c.tipo_descripcion)
        .map(c => c.nombre || c.tipo_descripcion)
        .filter(Boolean))];
      setTiposClaseAsignados(tiposUnicos);

      // Separar clases por semana
      const hoyStr = hoy.toISOString().split('T')[0];
      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + (7 - finSemana.getDay())); // Domingo de esta semana
      const finSemanaStr = finSemana.toISOString().split('T')[0];

      // Filtrar solo clases futuras y de hoy
      const clasesFuturas = todasLasClases.data.filter(c => c.fecha >= hoyStr);

      // Separar en "Esta semana" y "Próximas"
      const estaSemana = clasesFuturas.filter(c => c.fecha <= finSemanaStr);
      const proximas = clasesFuturas.filter(c => c.fecha > finSemanaStr);

      // Ordenar cada grupo
      const ordenarClases = (clases) => {
        return clases.sort((a, b) => {
          if (a.fecha === b.fecha) {
            return a.hora_inicio.localeCompare(b.hora_inicio);
          }
          return a.fecha.localeCompare(b.fecha);
        });
      };

      setClasesEstaSemana(ordenarClases(estaSemana));
      setClasesProximas(ordenarClases(proximas));
      setClases(ordenarClases(clasesFuturas));
    } catch (error) {
      console.error('Error al cargar clases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerSocios = async (clase) => {
    if (!user || !user.instructor_id) return;
    
    setSelectedClase(clase);
    setLoadingSocios(true);
    try {
      const data = await getSociosClase(user.instructor_id, clase.id);
      const activos = (data.data || []).filter(reserva => reserva.estado !== 'cancelado');
      setSociosInscriptos(activos);
    } catch (error) {
      console.error('Error al cargar socios:', error);
      alert('Error al cargar socios inscriptos');
    } finally {
      setLoadingSocios(false);
    }
  };

  const handleCancelClass = async (claseId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta clase? Se cancelarán todas las reservas activas.')) {
      return;
    }

    try {
      await cancelClass(claseId);
      alert('Clase cancelada correctamente');
      loadClases(); // Recargar clases
    } catch (error) {
      console.error('Error al cancelar clase:', error);
      alert(error.response?.data?.error || 'Error al cancelar clase');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8 animate-fade-in-up">
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
          Panel de instructor
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
          Bienvenido a <span className="text-blue-600">FitSense</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Organizá tus clases, revisá la ocupación y acompañá a tus alumnos desde un solo panel,
          manteniendo tus horarios y grupos siempre claros.
        </p>
      </div>

      <h2 className="text-xl font-bold mb-6">Dashboard Instructor</h2>

      {/* Información del Instructor */}
      {instructor && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Mi Información</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Nombre</div>
              <div className="font-medium">{instructor.nombre}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-medium">{instructor.email}</div>
            </div>
            {instructor.telefono && (
              <div>
                <div className="text-sm text-gray-600">Teléfono</div>
                <div className="font-medium">{instructor.telefono}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Estado</div>
              <div>
                <span className={`px-2 py-1 rounded text-xs ${
                  instructor.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {instructor.activo === 1 ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            {tiposClaseAsignados.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600 mb-1">Tipos de Clase Asignados</div>
                <div className="flex flex-wrap gap-2">
                  {tiposClaseAsignados.map((tipo, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tipo}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total de Clases</div>
          <div className="text-2xl font-bold">{stats.totalClases}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Ocupación Promedio</div>
          <div className="text-2xl font-bold">{stats.ocupacionPromedio}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Clases Este Mes</div>
          <div className="text-2xl font-bold">{stats.clasesEsteMes}</div>
        </div>
      </div>

      {/* Lista de Clases */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Mis Clases</h2>
        {clases.length === 0 ? (
          <div className="text-gray-500 text-sm">No tienes clases asignadas</div>
        ) : (
          <div className="space-y-6">
            {/* Esta Semana */}
            {clasesEstaSemana.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-700 mb-3">Esta Semana</h3>
                <div className="space-y-3">
                  {clasesEstaSemana.map((clase) => (
                    <div key={clase.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{clase.nombre || clase.tipo_descripcion}</div>
                          <div className="text-sm text-gray-600">
                            {clase.fecha} • {clase.hora_inicio} - {clase.hora_fin}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Ocupación: {clase.ocupados || 0}/{clase.cupo} ({clase.porcentaje || 0}%)
                          </div>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              clase.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {clase.estado}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => handleVerSocios(clase)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                          >
                            Ver Socios
                          </button>
                          {clase.estado === 'activa' && (
                            <button
                              onClick={() => handleCancelClass(clase.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 whitespace-nowrap"
                            >
                              Cancelar Clase
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximas */}
            {clasesProximas.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-700 mb-3">Próximas</h3>
                <div className="space-y-3">
                  {clasesProximas.map((clase) => (
                    <div key={clase.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{clase.nombre || clase.tipo_descripcion}</div>
                          <div className="text-sm text-gray-600">
                            {clase.fecha} • {clase.hora_inicio} - {clase.hora_fin}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Ocupación: {clase.ocupados || 0}/{clase.cupo} ({clase.porcentaje || 0}%)
                          </div>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              clase.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {clase.estado}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => handleVerSocios(clase)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                          >
                            Ver Socios
                          </button>
                          {clase.estado === 'activa' && (
                            <button
                              onClick={() => handleCancelClass(clase.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 whitespace-nowrap"
                            >
                              Cancelar Clase
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Socios Inscriptos */}
      {selectedClase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Socios Inscriptos</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedClase.nombre || selectedClase.tipo_descripcion} - {selectedClase.fecha}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClase(null);
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
                        <div className="font-medium mb-1">{reserva.socio_nombre}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Documento: {reserva.socio_documento || 'N/A'}
                        </div>
                        {reserva.socio_telefono && (
                          <div className="text-sm text-gray-600 mb-2">
                            Teléfono: {reserva.socio_telefono}
                          </div>
                        )}
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

