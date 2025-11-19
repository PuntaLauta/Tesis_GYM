import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMySocio, updateSocio } from '../services/socios';

export default function Profile() {
  const { user } = useAuth();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Formulario de perfil
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Formulario de contraseña (placeholder)
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user && user.rol === 'cliente') {
      loadSocio();
    }
  }, [user]);

  const loadSocio = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMySocio();
      if (data.data) {
        setSocio(data.data);
        setTelefono(data.data.telefono || '');
        setEmail(user.email || '');
      } else {
        setError('No tienes un socio asociado. Contacta al administrador.');
      }
    } catch (err) {
      console.error('Error al cargar socio:', err);
      setError(err.response?.data?.error || 'Error al cargar tu información');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!socio) return;
    
    setSavingProfile(true);
    setError('');
    setSuccess('');
    
    try {
      await updateSocio(socio.id, { telefono, email });
      setSuccess('Perfil actualizado correctamente');
      setEditingProfile(false);
      await loadSocio();
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = () => {
    // Placeholder - funcionalidad pendiente
    alert('Funcionalidad de cambio de contraseña próximamente. Por ahora, contacta a recepción para cambiar tu contraseña.');
    setShowPasswordForm(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user || user.rol !== 'cliente') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Acceso denegado. Esta página es solo para clientes.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Información del Perfil */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Información Personal</h2>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Editar
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={socio?.nombre || ''}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                El nombre no se puede modificar. Contacta a recepción para cambios.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="123456789"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={() => {
                  setEditingProfile(false);
                  setTelefono(socio?.telefono || '');
                  setEmail(user.email || '');
                  setError('');
                }}
                disabled={savingProfile}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p><strong>Nombre:</strong> {socio?.nombre || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {socio?.telefono || 'No registrado'}</p>
            <p><strong>Estado:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                socio?.estado === 'activo' ? 'bg-green-100 text-green-800' :
                socio?.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {socio?.estado || 'N/A'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Cambiar Contraseña */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Seguridad</h2>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Cambiar Contraseña
            </button>
          )}
        </div>

        {showPasswordForm && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-sm text-yellow-800">
                <strong>Funcionalidad en desarrollo</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                El cambio de contraseña estará disponible próximamente. Por ahora, contacta a recepción 
                para cambiar tu contraseña.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 cursor-not-allowed"
                disabled
              >
                Cambiar Contraseña (Próximamente)
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

