import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listMine, listByClass, cancelReservation, markAttendance } from '../services/reservations';
import { listClasses } from '../services/classes';

export default function Reservations() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroClase, setFiltroClase] = useState('');

  const isAdmin = user?.rol === 'admin' || user?.rol === 'root';

  useEffect(() => {
    loadData();
  }, [filtroClase]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        if (filtroClase) {
          const data = await listByClass(parseInt(filtroClase));
          setReservas(data.data || []);
        } else {
          setReservas([]);
        }
        const clasesData = await listClasses();
        setClases(clasesData.data || []);
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
          <label className="block text-sm font-medium mb-2">Filtrar por clase</label>
          <select
            value={filtroClase}
            onChange={(e) => setFiltroClase(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-auto"
          >
            <option value="">Todas las clases</option>
            {clases.map((clase) => (
              <option key={clase.id} value={clase.id}>
                {clase.nombre} - {clase.fecha}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {reservas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isAdmin ? 'Selecciona una clase para ver sus reservas' : 'No tienes reservas'}
            </div>
          ) : (
            reservas.map((reserva) => (
              <div key={reserva.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{reserva.clase_nombre || 'Clase'}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {reserva.fecha && `${reserva.fecha} • ${reserva.hora_inicio} - ${reserva.hora_fin}`}
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



