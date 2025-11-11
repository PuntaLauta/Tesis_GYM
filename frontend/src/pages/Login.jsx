import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      // Redirección por rol
      if (u.rol === "cliente") nav("/client");
      else if (u.rol === "admin") nav("/admin");
      else if (u.rol === "root") nav("/root");
      else nav("/");
    } catch (e) {
      setErr("Credenciales inválidas");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
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
      </form>
    </div>
  );
}
