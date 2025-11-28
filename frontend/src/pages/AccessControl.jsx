import { useState } from 'react';
import AccessForm from '../components/AccessForm';
import { verifyByToken, enterByToken } from '../services/access';

export default function AccessControl() {
  const [token, setToken] = useState('');
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('Ingresa un token');
      return;
    }

    setError('');
    setLoading(true);
    setVerification(null);

    try {
      const data = await verifyByToken(token);
      setVerification(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al verificar token');
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = async () => {
    if (!token.trim()) {
      setError('Ingresa un token');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await enterByToken(token);
      setVerification(data.data);
      alert(`Acceso ${data.data.permitido ? 'PERMITIDO ✅' : 'DENEGADO ❌'}\n${data.data.motivo}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Control de Acceso</h1>

      {/* Verificación por Token QR */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Verificación por Token QR</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Token QR</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pega el token o escanea el QR"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
            <button
              onClick={handleEnter}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Acceso'}
            </button>
          </div>
          {verification && (
            <div className={`p-4 rounded ${verification.activo ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className={`font-bold text-lg ${verification.activo ? 'text-green-800' : 'text-red-800'}`}>
                {verification.activo ? '✅ Permitido' : '❌ Denegado'}
              </div>
              {verification.socio && (
                <div className="text-sm mt-1">
                  Socio: {verification.socio.nombre} (Documento: {verification.socio.documento || verification.socio.id})
                </div>
              )}
              <div className="text-sm mt-1">{verification.motivo}</div>
            </div>
          )}
        </div>
      </div>

      {/* Acceso por DNI de Socio */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Acceso por DNI de Socio</h2>
        <AccessForm />
      </div>
    </div>
  );
}


