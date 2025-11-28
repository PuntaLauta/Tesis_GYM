import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listMine, listReservations, cancelReservation, markAttendance } from '../services/reservations';
import { listTiposClase } from '../services/tipoClase';

export default function Reservations() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [tiposClase, setTiposClase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipoClase, setFiltroTipoClase] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const isAdmin = user?.rol === 'admin' || user?.rol === 'root';

  useEffect(() => {
    if (isAdmin) {
      loadTiposClase();
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [filtroTipoClase, filtroFecha]);

  const loadTiposClase = async () => {
    try {
      const data = await listTiposClase();
      setTiposClase(data.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de clase:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Solo cargar reservas si hay al menos un filtro
        if (filtroTipoClase || filtroFecha) {
          const filters = {};
          if (filtroTipoClase) {
            filters.tipo_clase_id = filtroTipoClase;
          }
          if (filtroFecha) {
            filters.fecha = filtroFecha;
          }
          const data = await listReservations(filters);
          setReservas(data.data || []);
        } else {
          setReservas([]);
        }
      } else {
        const data = await listMine();
        setReservas(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
      await cancelReservation(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cancelar reserva');
    }
  };

  const handleAttendance = async (id, estado) => {
    try {
      await markAttendance(id, estado);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al marcar asistencia');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isAdmin ? 'Gestión de Reservas' : 'Mis Reservas'}
      </h1>

      {isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por tipo de clase</label>
              <select
                value={filtroTipoClase}
                onChange={(e) => setFiltroTipoClase(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Seleccionar tipo de clase</option>
                {tiposClase.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por fecha</label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {reservas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isAdmin 
                ? (!filtroTipoClase && !filtroFecha 
                    ? 'Selecciona al menos un filtro para comenzar' 
                    : 'No se encontraron reservas con los filtros seleccionados')
                : 'No tienes reservas'}
            </div>
          ) : (
            reservas.map((reserva) => (
              <div key={reserva.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{reserva.clase_nombre || 'Clase'}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {reserva.clase_fecha && `${reserva.clase_fecha} • ${reserva.hora_inicio} - ${reserva.hora_fin}`}
                    </div>
                    {isAdmin && (
                      <div className="text-sm text-gray-600">Socio: {reserva.socio_nombre}</div>
                    )}
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reserva.estado === 'reservado' ? 'bg-blue-100 text-blue-800' :
                        reserva.estado === 'asistio' ? 'bg-green-100 text-green-800' :
                        reserva.estado === 'ausente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reserva.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {reserva.estado === 'reservado' && (
                      <button
                        onClick={() => handleCancel(reserva.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Cancelar
                      </button>
                    )}
                    {isAdmin && reserva.estado === 'reservado' && (
                      <>
                        <button
                          onClick={() => handleAttendance(reserva.id, 'asistio')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Asistió
                        </button>
                        <button
                          onClick={() => handleAttendance(reserva.id, 'ausente')}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          Ausente
                        </button>
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



