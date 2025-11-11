import { useState, useEffect } from 'react';
import { downloadQr, rotateQr } from '../services/socios';

export default function SocioQrCard({ socioId }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQr = async () => {
    setLoading(true);
    setError('');
    try {
      const blob = await downloadQr(socioId);
      const url = URL.createObjectURL(blob);
      setQrUrl(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadQr(socioId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-socio-${socioId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al descargar QR');
    }
  };

  const handleRotate = async () => {
    if (!confirm('¿Estás seguro de regenerar el QR? El token anterior dejará de ser válido.')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await rotateQr(socioId);
      await loadQr(); // Recargar QR con nuevo token
      alert('QR regenerado correctamente');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al regenerar QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (socioId) {
      loadQr();
    }
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
  }, [socioId]);

  if (!socioId) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-3">Código QR del Socio</h3>
      
      {loading && !qrUrl && (
        <div className="text-center py-4">Cargando QR...</div>
      )}

      {error && (
        <div className="text-red-600 text-sm mb-3">{error}</div>
      )}

      {qrUrl && (
        <div className="text-center mb-3">
          <img 
            src={qrUrl} 
            alt="QR Code" 
            className="mx-auto border rounded"
            style={{ maxWidth: '200px' }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={loading || !qrUrl}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Descargar QR
        </button>
        <button
          onClick={handleRotate}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Regenerando...' : 'Regenerar QR'}
        </button>
      </div>
    </div>
  );
}

