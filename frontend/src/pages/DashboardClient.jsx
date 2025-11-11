import { useState, useEffect } from 'react';
import { getMySocio, downloadQr } from '../services/socios';

export default function DashboardClient() {
  const [socio, setSocio] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    loadSocio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
  }, [qrUrl]);

  const formatSocioId = (id, nombre) => {
    if (!id) return '';
    const num = String(id).padStart(2, '0');
    const initials = (nombre || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('')
      .padEnd(2, 'A')
      .slice(0, 2);
    return `${num}-${initials}`;
  };

  const loadSocio = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMySocio();
      if (data.data) {
        setSocio(data.data);
        loadQr(data.data.id);
      } else {
        setError('No tienes un socio asociado. Contacta al administrador.');
      }
    } catch (err) {
      console.error('Error al cargar socio:', err);
      setError(err.response?.data?.error || 'Error al cargar tu información');
    } finally {
      setLoading(false);
    }
  };

  const loadQr = async (socioId) => {
    try {
      setQrError('');
      const blob = await downloadQr(socioId);
      const url = URL.createObjectURL(blob);
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
      setQrUrl(url);
    } catch (err) {
      console.error('Error al cargar QR:', err);
      setQrError(err.response?.data?.error || 'No se pudo cargar el QR');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Panel</h1>

      {socio && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Mi Información</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {formatSocioId(socio.id, socio.nombre)}</p>
            <p><strong>Nombre:</strong> {socio.nombre}</p>
            {socio.telefono && <p><strong>Teléfono:</strong> {socio.telefono}</p>}
            <p><strong>Estado:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                socio.estado === 'activo' ? 'bg-green-100 text-green-800' :
                socio.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {socio.estado}
              </span>
            </p>
            {socio.plan_nombre && <p><strong>Plan:</strong> {socio.plan_nombre}</p>}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Mi Código QR de Acceso</h2>
        <p className="text-sm text-gray-600 mb-4">
          Muestra este código QR al llegar al gimnasio para verificar tu acceso.
        </p>
        
        {qrUrl ? (
          <div className="text-center">
            <img 
              src={qrUrl} 
              alt="Mi QR de Acceso" 
              className="mx-auto border rounded mb-4"
              style={{ maxWidth: '300px' }}
            />
            <button
              onClick={async () => {
                try {
                  const blob = await downloadQr(socio.id);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mi-qr-gym.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (err) {
                  alert('Error al descargar QR');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Descargar QR
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Cargando QR...
          </div>
        )}
        {qrError && <div className="text-center text-red-600 text-sm mt-2">{qrError}</div>}
      </div>
    </div>
  );
}
