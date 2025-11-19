import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardRoot from "./pages/DashboardRoot";
import Classes from "./pages/Classes";
import Reservations from "./pages/Reservations";
import AccessControl from "./pages/AccessControl";
import Reports from "./pages/Reports";
import Socios from "./pages/Socios";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/client" element={
          <ProtectedRoute>
            <RoleRoute roles={["cliente"]}>
              <Home />
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

            <Route path="/profile" element={
              <ProtectedRoute>
                <RoleRoute roles={["cliente"]}>
                  <Profile />
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
