import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function QuickActions() {
  const { user } = useAuth();

  // Solo mostrar para admin/root
  if (!user || (user.rol !== 'admin' && user.rol !== 'root')) {
    return null;
  }

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Acciones Rapidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Link
            to="/classes"
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center text-xs"
          >
            Nueva Clase
          </Link>
          <Link
            to="/socios"
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center text-xs"
          >
            Nuevo Socio
          </Link>
          <Link
            to="/socios"
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center text-xs"
          >
            Registrar Pago
          </Link>
          <Link
            to="/access"
            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-center text-xs"
          >
            Verificar Acceso
          </Link>
        </div>
      </div>
    </div>
  );
}

