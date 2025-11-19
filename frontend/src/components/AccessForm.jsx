import { useState } from 'react';
import { registerAccess } from '../services/access';

export default function AccessForm({ onSuccess }) {
  const [socioId, setSocioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await registerAccess(parseInt(socioId));
      setResult(data.data);
      setSocioId('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">ID del Socio</label>
          <input
            type="number"
            required
            value={socioId}
            onChange={(e) => setSocioId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ingrese el ID del socio"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Registrar Acceso'}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {result && (
        <div className={`p-4 rounded ${result.permitido ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className={`font-bold text-lg ${result.permitido ? 'text-green-800' : 'text-red-800'}`}>
            {result.permitido ? '✅ Permitido' : '❌ Denegado'}
          </div>
          <div className="text-sm mt-1">{result.motivo}</div>
        </div>
      )}
    </div>
  );
}



