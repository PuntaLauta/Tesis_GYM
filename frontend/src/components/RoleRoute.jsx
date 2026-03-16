import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ roles = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-6">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Si es cliente cancelado por admin, redirigir siempre a su panel principal
  // excepto en la ruta del Asistente, donde mostramos un banner de error dentro de la página
  if (
    user.rol === 'cliente' &&
    user.cancelado_por_admin &&
    location.pathname !== '/asistente'
  ) {
    return <Navigate to="/client" replace />;
  }
  // Admin o root con acceso deshabilitado: puede iniciar sesión pero sin funciones (como cliente inactivo)
  if (
    (user.rol === 'admin' || user.rol === 'root') &&
    user.estado_activo === false &&
    location.pathname !== '/acceso-deshabilitado'
  ) {
    return <Navigate to="/acceso-deshabilitado" replace />;
  }
  if (!roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}



