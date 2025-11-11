import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Bienvenido a Gestión GYM</h1>
      {!user ? (
        <div className="space-y-2">
          <p>Iniciá sesión para acceder a tu panel.</p>
          <Link to="/login" className="px-3 py-2 bg-blue-600 text-white rounded">Ir al Login</Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p>Hola, <b>{user.nombre}</b>. Tu rol es <b>{user.rol}</b>.</p>
          <p>Usá el menú para ir a tu dashboard.</p>
        </div>
      )}
    </div>
  );
}
