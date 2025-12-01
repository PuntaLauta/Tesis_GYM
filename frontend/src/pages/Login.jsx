import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const u = await login(email, password);
      // Redirección según rol: clientes van a /, otros roles a /dashboard
      if (u.rol === 'cliente') {
        nav("/");
      } else {
        nav("/dashboard");
      }
    } catch (e) {
      setErr("Credenciales inválidas");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 pb-12">
      <div className="flex justify-center mb-6">
        <Logo size="xl" />
      </div>
      <h1 className="text-xl font-bold mb-4">Ingresar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input 
          className="w-full border rounded px-3 py-2" 
          placeholder="Email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          required
        />
        <input 
          className="w-full border rounded px-3 py-2" 
          type="password" 
          placeholder="Contraseña" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          required
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-gray-900 text-white rounded py-2">Entrar</button>
        <div className="text-center mt-3">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </div>
  );
}
