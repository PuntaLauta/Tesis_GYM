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
  if (!roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}



