import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActivosInactivos, getIngresos, getOcupacionClases } from '../services/reports';
import { listClasses } from '../services/classes';
import { listAll } from '../services/reservations';
import { listAllPayments } from '../services/pagos';
import { listSocios } from '../services/socios';
import StatCards from '../components/StatCards';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [ingresos, setIngresos] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [sociosData, setSociosData] = useState(null);
  const [reservasRecientes, setReservasRecientes] = useState([]);
  const [pagosRecientes, setPagosRecientes] = useState([]);
  const [totalSocios, setTotalSocios] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);
      const desdeMes = inicioMes.toISOString().split('T')[0];
      const hastaMes = finMes.toISOString().split('T')[0];
      
      // Cargar datos en paralelo
      const [
        activosData,
        ingresosData,
        ocupacionData,
        clasesData,
        reservasData,
        pagosData,
        sociosData
      ] = await Promise.all([
        getActivosInactivos(),
        getIngresos({ desde: hoy, hasta: hoy }),
        getOcupacionClases({ desde: hoy, hasta: hoy }),
        listClasses({ desde: desdeMes, hasta: hastaMes }),
        listAll(),
        listAllPayments(),
        listSocios()
      ]);

      setStats(activosData.data);
      setIngresos(ingresosData.data);
      setOcupacion(ocupacionData.data);
      
      // Clases del mes
      setClasesHoy(clasesData.data || []);
      
      // Obtener últimas 10 reservas
      const reservasOrdenadas = (reservasData.data || []).sort((a, b) => 
        new Date(b.ts) - new Date(a.ts)
      );
      setReservasRecientes(reservasOrdenadas.slice(0, 10));
      
      // Obtener últimos 10 pagos
      const pagosOrdenados = (pagosData.data || []).sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      setPagosRecientes(pagosOrdenados.slice(0, 10));
      
      setTotalSocios(sociosData.data?.length || 0);
      setSociosData(sociosData);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClasesConAlerta = () => {
    if (!ocupacion?.clases) return [];
    return ocupacion.clases.filter(clase => 
      clase.porcentaje >= 90 || clase.ocupados >= clase.cupo
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">Cargando dashboard...</div>
      </div>
    );
  }

  const clasesAlerta = getClasesConAlerta();
  const ingresosHoy = ingresos?.total || 0;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedSocios = () => {
    if (!sociosData?.data) return [];
    
    const sorted = [...sociosData.data];
    if (!sortConfig.key) return sorted;

    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejar valores null/undefined
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convertir a string para comparar
      if (sortConfig.key === 'documento') {
        // Para documento, comparar como string
        aValue = String(a.documento || '').toLowerCase();
        bValue = String(b.documento || '').toLowerCase();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Dashboard Administrador</h1>

      {/* Acciones Rapidas */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-bold mb-4 text-center md:text-left">Acciones Rapidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 justify-items-center md:justify-items-stretch">
          <Link
            to="/classes"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center text-sm w-full md:w-auto"
          >
            Nueva Clase
          </Link>
          <Link
            to="/socios"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center text-sm w-full md:w-auto"
          >
            Nuevo Socio
          </Link>
          <Link
            to="/pagos"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center text-sm w-full md:w-auto"
          >
            Gestionar Pagos
          </Link>
          <Link
            to="/access"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-center text-sm w-full md:w-auto"
          >
            Verificar Acceso
          </Link>
        </div>
      </div>

      {/* Tarjetas de Estadisticas */}
      <StatCards
        stats={{
          ...stats,
          totalIngresos: ingresosHoy,
          promedioOcupacion: ocupacion?.promedio || 0,
        }}
      />

      {/* Alertas y Notificaciones */}
      {clasesAlerta.length > 0 && (
        <div className="mb-6 space-y-3">

          {clasesAlerta.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-orange-400 text-xl">📢</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    {clasesAlerta.length} {clasesAlerta.length === 1 ? 'clase con cupo' : 'clases con cupo'} lleno o casi lleno
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <Link to="/classes" className="underline">Ver clases</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de Socios */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Socios</h2>
          <div className="flex gap-2">
            <button
              onClick={loadDashboard}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Actualizar
            </button>
            <Link
              to="/socios"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Gestionar
            </Link>
          </div>
        </div>
        {totalSocios === 0 ? (
          <div className="text-gray-500 text-sm">No hay socios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left py-2 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('documento')}
                  >
                    Documento {sortConfig.key === 'documento' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left py-2 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left py-2 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('telefono')}
                  >
                    Telefono {sortConfig.key === 'telefono' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left py-2 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('usuario_email')}
                  >
                    Email {sortConfig.key === 'usuario_email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left py-2 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('estado')}
                  >
                    Estado {sortConfig.key === 'estado' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left py-2 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('plan_nombre')}
                  >
                    Plan {sortConfig.key === 'plan_nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-2" style={{ maxWidth: '200px', width: '200px' }}>
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedSocios().map((socio) => (
                  <tr key={socio.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      {socio.documento || String(socio.id).padStart(4, '0')}
                    </td>
                    <td className="py-2">{socio.nombre}</td>
                    <td className="py-2">{socio.telefono || '-'}</td>
                    <td className="py-2">{socio.usuario_email || '-'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        socio.estado === 'activo' ? 'bg-green-100 text-green-800' :
                        socio.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {socio.estado}
                      </span>
                    </td>
                    <td className="py-2">{socio.plan_nombre || 'Sin plan'}</td>
                    <td className="py-2 max-w-xs">
                      {socio.notas ? (
                        <span className="text-xs text-gray-700 block truncate" title={socio.notas} style={{ maxWidth: '200px' }}>
                          {socio.notas}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clases del Mes */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Clases del Mes</h2>
            <Link to="/classes" className="text-sm text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {clasesHoy.length === 0 ? (
            <div className="text-gray-500 text-sm">No hay clases programadas para este mes</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {clasesHoy.map((clase) => (
                <div key={clase.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{clase.nombre}</div>
                      <div className="text-sm text-gray-600">
                        {clase.fecha} • {clase.hora_inicio} - {clase.hora_fin}
                        {clase.instructor && ` • ${clase.instructor}`}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Ocupacion: {clase.ocupados || 0}/{clase.cupo} ({clase.porcentaje || 0}%)
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      clase.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {clase.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Ultimas Reservas */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Ultimas Reservas</h2>
            <Link to="/reservations" className="text-sm text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {reservasRecientes.length === 0 ? (
            <div className="text-gray-500 text-sm">No hay reservas recientes</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reservasRecientes.map((reserva) => (
                <div key={reserva.id} className="border-b pb-2">
                  <div className="font-medium">{reserva.socio_nombre || 'Socio'}</div>
                  <div className="text-sm text-gray-600">
                    {reserva.clase_nombre || 'Clase'} • {new Date(reserva.ts).toLocaleString('es-AR')}
                  </div>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                    reserva.estado === 'reservado' ? 'bg-blue-100 text-blue-800' :
                    reserva.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                    reserva.estado === 'asistio' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {reserva.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ultimos Pagos */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Ultimos Pagos</h2>
            <Link to="/socios" className="text-sm text-blue-600 hover:underline">
              Ver socios
            </Link>
          </div>
          {pagosRecientes.length === 0 ? (
            <div className="text-gray-500 text-sm">No hay pagos recientes</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pagosRecientes.map((pago) => (
                <div key={pago.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{pago.socio_nombre || 'Socio'}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(pago.fecha).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                    <div className="text-green-600 font-semibold">
                      ${pago.monto.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de Ingresos de Hoy */}
      {ingresosHoy > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h2 className="font-bold mb-2">Ingresos de Hoy</h2>
          <div className="text-3xl font-bold text-green-600">
            ${ingresosHoy.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {ingresos?.resumen?.totalPagos || 0} {ingresos?.resumen?.totalPagos === 1 ? 'pago' : 'pagos'} registrados
          </div>
        </div>
      )}
    </div>
  );
}
