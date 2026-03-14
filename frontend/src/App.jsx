import { Component, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import InstructorGuard from "./components/InstructorGuard";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardRoot from "./pages/DashboardRoot";
import Classes from "./pages/Classes";
import AccessControl from "./pages/AccessControl";
const Reports = lazy(() => import("./pages/Reports"));
import Socios from "./pages/Socios";

class ReportsErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error al cargar reportes</h2>
          <p className="text-gray-600 mb-4">Algo falló al mostrar esta página. Revisa la consola del navegador para más detalles.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
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
import RutinasInstructor from "./pages/RutinasInstructor";
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
    return (
      <InstructorGuard>
        <DashboardInstructor />
      </InstructorGuard>
    );
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
              <InstructorGuard>
                <ProfileInstructor />
              </InstructorGuard>
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
                  <ReportsErrorBoundary>
                    <Suspense fallback={<div className="p-4">Cargando reportes...</div>}>
                      <Reports />
                    </Suspense>
                  </ReportsErrorBoundary>
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

        <Route path="/instructor/rutinas" element={
          <ProtectedRoute>
            <RoleRoute roles={["instructor"]}>
              <InstructorGuard>
                <RutinasInstructor />
              </InstructorGuard>
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
