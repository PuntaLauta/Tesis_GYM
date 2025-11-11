import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReservation } from '../services/reservations';

export default function ReserveButton({ clase, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [socioId, setSocioId] = useState('');

  const handleReserve = async () => {
    if (user.rol === 'admin' || user.rol === 'root') {
      setShowModal(true);
      return;
    }

    // Cliente reserva para sí mismo
    await doReserve();
  };

  const doReserve = async () => {
    setError('');
    setLoading(true);

    try {
      await createReservation({
        clase_id: clase.id,
        socio_id: user.rol !== 'cliente' ? parseInt(socioId) : undefined,
      });
      setShowModal(false);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  const isFull = clase.ocupados >= clase.cupo;

  return (
    <>
      <button
        onClick={handleReserve}
        disabled={isFull || loading || clase.estado !== 'activa'}
        className={`px-3 py-1 rounded text-sm ${
          isFull || clase.estado !== 'activa'
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isFull ? 'Cupo lleno' : clase.estado !== 'activa' ? 'Cancelada' : 'Reservar'}
      </button>

      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-md w-full mx-4">
            <h3 className="font-bold mb-4">Reservar para socio</h3>
            <input
              type="number"
              placeholder="ID del socio"
              value={socioId}
              onChange={(e) => setSocioId(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            />
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <div className="flex gap-2">
              <button
                onClick={doReserve}
                disabled={loading || !socioId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Reservando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError('');
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

