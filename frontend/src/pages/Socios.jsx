import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listSocios, createSocio, updateSocio, deleteSocio } from '../services/socios';
import { listPlanes } from '../services/planes';
import SocioQrCard from '../components/SocioQrCard';

export default function Socios() {
  const [socios, setSocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [selectedSocioId, setSelectedSocioId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    estado: 'activo',
    plan_id: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    loadPlanes();
    loadSocios();
  }, []);

  const loadPlanes = async () => {
    try {
      const data = await listPlanes();
      setPlanes(data.data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    }
  };

  const loadSocios = async () => {
    setLoading(true);
    try {
      const data = await listSocios();
      setSocios(data.data || []);
    } catch (error) {
      console.error('Error al cargar socios:', error);
      alert('Error al cargar socios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSocio) {
        // Si hay contraseña nueva, incluirla en la actualización
        const updateData = { ...formData };
        // Solo incluir password si se proporcionó una nueva
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        // No enviar email en la actualización (ya está deshabilitado)
        delete updateData.email;
        await updateSocio(editingSocio.id, updateData);
      } else {
        await createSocio(formData);
      }
      setShowForm(false);
      setEditingSocio(null);
      setFormData({ nombre: '', telefono: '', estado: 'activo', plan_id: '', email: '', password: '' });
      loadSocios();
      alert(editingSocio ? 'Socio actualizado' : 'Socio creado. QR generado automáticamente.');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar socio');
    }
  };

  const handleEdit = (socio) => {
    setEditingSocio(socio);
    setFormData({
      nombre: socio.nombre,
      telefono: socio.telefono || '',
      estado: socio.estado,
      plan_id: socio.plan_id || '',
      email: socio.usuario_email || '',
      password: '',
    });
    setShowForm(true);
  };

  const handleChangePassword = async (socioId, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await updateSocio(socioId, { password: newPassword });
      alert('Contraseña actualizada correctamente');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar contraseña');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este socio?')) return;
    try {
      await deleteSocio(id);
      loadSocios();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar socio');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Socios</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSocio(null);
            setFormData({ nombre: '', telefono: '', estado: 'activo', plan_id: '', email: '', password: '' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Nuevo Socio
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingSocio ? 'Editar Socio' : 'Nuevo Socio'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plan</label>
              <select
                value={formData.plan_id}
                onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Sin plan</option>
                {planes.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} - ${plan.precio} ({plan.duracion} días)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            {!editingSocio && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (para credenciales) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="ejemplo@clientes.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña (para credenciales) *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Minimo 6 caracteres"
                    minLength={6}
                  />
                </div>
              </>
            )}
            {editingSocio && editingSocio.usuario_id && (
              <div>
                <label className="block text-sm font-medium mb-1">Cambiar Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Dejar vacio para no cambiar (minimo 6 caracteres si se cambia)"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Dejar vacio si no deseas cambiar la contraseña</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSocio(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <div className="space-y-4">
              {socios.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                  No hay socios registrados
                </div>
              ) : (
                socios.map((socio) => (
                  <div key={socio.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold">{socio.nombre}</h3>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <div>ID: {String(socio.id).padStart(4, '0')}</div>
                          {socio.telefono && <div>Telefono: {socio.telefono}</div>}
                          <div>Plan: {socio.plan_nombre || 'Sin plan'}</div>
                          {socio.usuario_email && (
                            <div>
                              <label className="font-medium">Email:</label>
                              <input
                                type="email"
                                value={socio.usuario_email}
                                disabled
                                className="ml-2 border rounded px-2 py-1 bg-gray-100 text-gray-600"
                              />
                            </div>
                          )}
                          {!socio.usuario_email && (
                            <div className="text-orange-600 text-xs">Sin credenciales</div>
                          )}
                        </div>
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          socio.estado === 'activo' ? 'bg-green-100 text-green-800' :
                          socio.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {socio.estado}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedSocioId(socio.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Ver QR
                        </button>
                        <button
                          onClick={() => handleEdit(socio)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          Editar
                        </button>
                        <Link
                          to="/pagos"
                          state={{ socio_id: socio.id }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 text-center"
                        >
                          Gestionar Pagos
                        </Link>
                        <button
                          onClick={() => handleDelete(socio.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedSocioId && (
            <div className="md:col-span-1">
              <SocioQrCard socioId={selectedSocioId} />
              <button
                onClick={() => setSelectedSocioId(null)}
                className="mt-2 w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



