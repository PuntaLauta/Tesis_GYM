import { useAuth } from '../context/AuthContext';

export default function AccesoDeshabilitado() {
  const { logout } = useAuth();

  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h1 className="text-xl font-semibold text-amber-800 mb-2">
          Acceso como administrador deshabilitado
        </h1>
        <p className="text-amber-700 mb-6">
          Puedes iniciar sesión, pero las funciones de administrador están deshabilitadas para tu cuenta.
          Contacta con un usuario root si necesitas que te activen el acceso.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
