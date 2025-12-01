import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardRoot from "./pages/DashboardRoot";
import Classes from "./pages/Classes";
import AccessControl from "./pages/AccessControl";
import Reports from "./pages/Reports";
import Socios from "./pages/Socios";
import Profile from "./pages/Profile";
import GestionPagos from "./pages/GestionPagos";
import GestionAdmins from "./pages/GestionAdmins";
import ConfiguracionGym from "./pages/ConfiguracionGym";
import GestionPlanes from "./pages/GestionPlanes";
import Backup from "./pages/Backup";
import DashboardInstructor from "./pages/DashboardInstructor";
import GestionInstructores from "./pages/GestionInstructores";
import ProfileInstructor from "./pages/ProfileInstructor";
import Asistente from "./pages/Asistente";
import MisRutinas from "./pages/MisRutinas";
import DetalleRutina from "./pages/DetalleRutina";
import NotFound from "./pages/NotFound";

function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (user.rol === 'admin') {
    return <DashboardAdmin />;
  }
  
  if (user.rol === 'root') {
    return <DashboardRoot />;
  }
  
  if (user.rol === 'instructor') {
    return <DashboardInstructor />;
  }
  
  if (user.rol === 'cliente') {
    return <Home />;
  }
  
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/client" element={
          <ProtectedRoute>
            <RoleRoute roles={["cliente"]}>
              <Home />
            </RoleRoute>
          </ProtectedRoute>
        }/>

        <Route path="/admin" element={
          <Navigate to="/" replace />
        }/>

        <Route path="/root" element={
          <Navigate to="/" replace />
        }/>

        <Route path="/instructor" element={
          <Navigate to="/" replace />
        }/>

        <Route path="/instructor/profile" element={
          <ProtectedRoute>
            <RoleRoute roles={["instructor"]}>
              <ProfileInstructor />
            </RoleRoute>
          </ProtectedRoute>
        }/>

        <Route path="/classes" element={
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        }/>

        <Route path="/access" element={
          <ProtectedRoute>
            <RoleRoute roles={["admin", "root"]}>
              <AccessControl />
            </RoleRoute>
          </ProtectedRoute>
        }/>

            <Route path="/reports" element={
              <ProtectedRoute>
                <RoleRoute roles={["admin", "root"]}>
                  <Reports />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/socios" element={
              <ProtectedRoute>
                <RoleRoute roles={["admin", "root"]}>
                  <Socios />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/pagos" element={
              <ProtectedRoute>
                <RoleRoute roles={["admin", "root"]}>
                  <GestionPagos />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/profile" element={
              <ProtectedRoute>
                <RoleRoute roles={["cliente"]}>
                  <Profile />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/asistente" element={
              <ProtectedRoute>
                <RoleRoute roles={["cliente"]}>
                  <Asistente />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/rutinas" element={
              <ProtectedRoute>
                <RoleRoute roles={["cliente"]}>
                  <MisRutinas />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/rutinas/:id" element={
              <ProtectedRoute>
                <RoleRoute roles={["cliente"]}>
                  <DetalleRutina />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/root/staff" element={
              <ProtectedRoute>
                <RoleRoute roles={["root"]}>
                  <GestionAdmins />
                </RoleRoute>
              </ProtectedRoute>
            }/>
            <Route path="/root/admins" element={
              <ProtectedRoute>
                <RoleRoute roles={["root"]}>
                  <GestionAdmins />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/root/configuracion" element={
              <ProtectedRoute>
                <RoleRoute roles={["root"]}>
                  <ConfiguracionGym />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/root/planes" element={
              <ProtectedRoute>
                <RoleRoute roles={["root"]}>
                  <GestionPlanes />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/root/backup" element={
              <ProtectedRoute>
                <RoleRoute roles={["root"]}>
                  <Backup />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="/admin/instructores" element={
              <ProtectedRoute>
                <RoleRoute roles={["admin", "root"]}>
                  <GestionInstructores />
                </RoleRoute>
              </ProtectedRoute>
            }/>

            <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
