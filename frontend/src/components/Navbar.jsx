import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold">Gestión GYM</Link>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/" className="text-sm">Home</Link>
              <Link to="/login" className="text-sm">Login</Link>
            </>
          ) : (
            <>
                <Link to={user.rol === 'cliente' ? '/' : user.rol === 'admin' ? '/admin' : '/root'} className="text-sm">Inicio</Link>
                {user.rol === 'root' ? (
                  <>
                    <Link to="/socios" className="text-sm">Socios</Link>
                    <Link to="/root/configuracion" className="text-sm">Configuracion</Link>
                  </>
                ) : (
                  <>
                    <Link to="/classes" className="text-sm">Clases</Link>
                    <Link to="/reservations" className="text-sm">Reservas</Link>
                    {user.rol === 'cliente' && (
                      <Link to="/profile" className="text-sm">Mi Perfil</Link>
                    )}
                    {user.rol === 'admin' && (
                      <>
                        <Link to="/socios" className="text-sm">Socios</Link>
                        <Link to="/pagos" className="text-sm">Gestionar Pagos</Link>
                        <Link to="/access" className="text-sm">Acceso</Link>
                        <Link to="/reports" className="text-sm">Reportes</Link>
                      </>
                    )}
                  </>
                )}
              <span className="text-sm text-gray-600">Rol: <b>{user.rol}</b></span>
              <button onClick={handleLogout} className="text-sm px-3 py-1 bg-gray-900 text-white rounded">
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
