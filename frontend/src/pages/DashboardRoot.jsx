import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listUsuarios } from '../services/usuarios';
import { listSocios } from '../services/socios';

export default function DashboardRoot() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalSocios: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usuariosData, sociosData] = await Promise.all([
        listUsuarios(),
        listSocios(),
      ]);

      setStats({
        totalAdmins: usuariosData.data?.length || 0,
        totalSocios: sociosData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panel Root</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Administradores</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalAdmins}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Socios</div>
          <div className="text-3xl font-bold text-green-600">{stats.totalSocios}</div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-bold mb-4">Gestion del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/root/admins"
            className="p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <div className="font-semibold mb-1">Gestionar Admins</div>
            <div className="text-sm text-gray-600">Crear y editar usuarios administradores</div>
          </Link>
          <Link
            to="/socios"
            className="p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <div className="font-semibold mb-1">Gestionar Socios</div>
            <div className="text-sm text-gray-600">Ver y gestionar todos los socios</div>
          </Link>
          <Link
            to="/root/configuracion"
            className="p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <div className="font-semibold mb-1">Configuracion</div>
            <div className="text-sm text-gray-600">Configurar datos del gimnasio</div>
          </Link>
          <Link
            to="/root/planes"
            className="p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <div className="font-semibold mb-1">Gestionar Planes</div>
            <div className="text-sm text-gray-600">Crear y editar planes de membresia</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
