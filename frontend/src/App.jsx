import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import DashboardClient from "./pages/DashboardClient";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardRoot from "./pages/DashboardRoot";
import Classes from "./pages/Classes";
import Reservations from "./pages/Reservations";
import AccessControl from "./pages/AccessControl";
import Reports from "./pages/Reports";
import Socios from "./pages/Socios";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/client" element={
          <ProtectedRoute>
            <RoleRoute roles={["cliente"]}>
              <DashboardClient />
            </RoleRoute>
          </ProtectedRoute>
        }/>

        <Route path="/admin" element={
          <ProtectedRoute>
            <RoleRoute roles={["admin","root"]}>
              <DashboardAdmin />
            </RoleRoute>
          </ProtectedRoute>
        }/>

        <Route path="/root" element={
          <ProtectedRoute>
            <RoleRoute roles={["root"]}>
              <DashboardRoot />
            </RoleRoute>
          </ProtectedRoute>
        }/>

        <Route path="/classes" element={
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        }/>

        <Route path="/reservations" element={
          <ProtectedRoute>
            <Reservations />
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

            <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
