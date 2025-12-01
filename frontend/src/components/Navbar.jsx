import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    nav("/login");
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const renderMenuItems = () => {
    if (!user) {
      return (
        <>
          <Link to="/" className="text-sm block py-2" onClick={closeMobileMenu}>Home</Link>
          <Link to="/login" className="text-sm block py-2" onClick={closeMobileMenu}>Login</Link>
        </>
      );
    }

    return (
      <>
        {/* Inicio y Asistente ya están fuera del menú en mobile, solo mostrar otros enlaces */}
        {user.rol === 'root' ? (
          <>
            <Link to="/socios" className="text-sm block py-2" onClick={closeMobileMenu}>Socios</Link>
            <Link to="/root/staff" className="text-sm block py-2" onClick={closeMobileMenu}>Staff</Link>
            <Link to="/root/configuracion" className="text-sm block py-2" onClick={closeMobileMenu}>Configuracion</Link>
            <Link to="/root/backup" className="text-sm block py-2" onClick={closeMobileMenu}>Backup</Link>
          </>
        ) : user.rol === 'instructor' ? (
          <>
            <Link to="/instructor/profile" className="text-sm block py-2" onClick={closeMobileMenu}>Mi Perfil</Link>
          </>
        ) : (
          <>
            <Link to="/classes" className="text-sm block py-2" onClick={closeMobileMenu}>Clases</Link>
            {user.rol === 'cliente' && (
              <Link to="/profile" className="text-sm block py-2" onClick={closeMobileMenu}>Mi Perfil</Link>
            )}
            {user.rol === 'admin' && (
              <>
                <Link to="/socios" className="text-sm block py-2" onClick={closeMobileMenu}>Socios</Link>
                <Link to="/pagos" className="text-sm block py-2" onClick={closeMobileMenu}>Gestionar Pagos</Link>
                <Link to="/access" className="text-sm block py-2" onClick={closeMobileMenu}>Acceso</Link>
                <Link to="/reports" className="text-sm block py-2" onClick={closeMobileMenu}>Reportes</Link>
                <Link to="/admin/instructores" className="text-sm block py-2" onClick={closeMobileMenu}>Instructores</Link>
              </>
            )}
          </>
        )}
        <div className="border-t border-gray-200 my-2 pt-2">
          <button 
            onClick={handleLogout} 
            className="text-sm px-3 py-2 bg-gray-900 text-white rounded w-full text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </>
    );
  };

  return (
    <nav className="bg-white border-b shadow-sm relative">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold">Gestión GYM</Link>
        
        {/* Menú Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/" className="text-sm">Home</Link>
              <Link to="/login" className="text-sm">Login</Link>
            </>
          ) : (
            <>
              <Link to={user.rol === 'cliente' ? '/' : user.rol === 'admin' ? '/admin' : user.rol === 'instructor' ? '/instructor' : '/root'} className="text-sm">Inicio</Link>
              {user.rol === 'root' ? (
                <>
                  <Link to="/socios" className="text-sm">Socios</Link>
                  <Link to="/root/staff" className="text-sm">Staff</Link>
                  <Link to="/root/configuracion" className="text-sm">Configuracion</Link>
                  <Link to="/root/backup" className="text-sm">Backup</Link>
                </>
              ) : user.rol === 'instructor' ? (
                <>
                  <Link to="/instructor/profile" className="text-sm">Mi Perfil</Link>
                </>
              ) : (
                <>
                  {user.rol === 'cliente' && (
                    <Link to="/asistente" className="text-sm px-3 py-1.5 bg-black text-white rounded font-semibold">🏋🏻‍♂️ Asistente</Link>
                  )}
                  <Link to="/classes" className="text-sm">Clases</Link>
                  {user.rol === 'cliente' && (
                    <Link to="/profile" className="text-sm">Mi Perfil</Link>
                  )}
                  {user.rol === 'admin' && (
                    <>
                      <Link to="/socios" className="text-sm">Socios</Link>
                      <Link to="/pagos" className="text-sm">Gestionar Pagos</Link>
                      <Link to="/access" className="text-sm">Acceso</Link>
                      <Link to="/reports" className="text-sm">Reportes</Link>
                      <Link to="/admin/instructores" className="text-sm">Instructores</Link>
                    </>
                  )}
                </>
              )}
              <button onClick={handleLogout} className="text-sm px-3 py-1 bg-gray-900 text-white rounded">
                Cerrar sesión
              </button>
            </>
          )}
        </div>

        {/* Botones y menú hamburguesa en mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <>
              {/* Para admin, root e instructores: solo botón Inicio */}
              {(user.rol === 'admin' || user.rol === 'root' || user.rol === 'instructor') && (
                <Link 
                  to={user.rol === 'admin' ? '/admin' : user.rol === 'instructor' ? '/instructor' : '/root'} 
                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Inicio
                </Link>
              )}
              {/* Para clientes: ambos botones */}
              {user.rol === 'cliente' && (
                <>
                  <Link 
                    to="/" 
                    className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Inicio
                  </Link>
                  <Link 
                    to="/asistente" 
                    className="text-sm px-3 py-1.5 bg-black text-white rounded font-semibold"
                    onClick={closeMobileMenu}
                  >
                    🏋🏻‍♂️ Asistente
                  </Link>
                </>
              )}
            </>
          )}
          {/* Botón Hamburguesa Mobile */}
          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú Mobile Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50 md:hidden">
            <div className="px-4 py-4 space-y-1">
              {renderMenuItems()}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
