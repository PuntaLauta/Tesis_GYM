import { createContext, useContext, useEffect, useState } from "react";
import { me, login as loginReq, logout as logoutReq } from "../services/auth";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: recuperar sesión
  useEffect(() => {
    me()
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Si no hay sesión, user queda null
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await loginReq(email, password);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await logoutReq();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
