import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInstructor, updateInstructorProfile } from '../services/instructores';
import { getMySecurityQuestion, setSecurityQuestion, changePassword } from '../services/auth';

export default function ProfileInstructor() {
  const { user } = useAuth();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Formulario de perfil
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Formulario de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Formulario de pregunta de seguridad
  const [preguntaSeguridad, setPreguntaSeguridad] = useState('');
  const [respuestaSeguridad, setRespuestaSeguridad] = useState('');
  const [editingSecurityQuestion, setEditingSecurityQuestion] = useState(false);
  const [savingSecurityQuestion, setSavingSecurityQuestion] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState(null);

  const PREGUNTAS_DISPONIBLES = [
    '¿Equipo de fútbol que seguís?',
    '¿Comida favorita?',
    '¿Ciudad donde naciste?',
    '¿Apellido de soltera de tu madre?',
    '¿Nombre de tu colegio primario?',
    '¿Nombre de tu mascota?'
  ];

  useEffect(() => {
    if (user && user.rol === 'instructor' && user.instructor_id) {
      loadInstructor();
      loadSecurityQuestion();
    }
  }, [user]);

  const loadSecurityQuestion = async () => {
    try {
      const data = await getMySecurityQuestion();
      setPreguntaActual(data.pregunta);
    } catch (err) {
      console.error('Error al cargar pregunta de seguridad:', err);
    }
  };

  const loadInstructor = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInstructor(user.instructor_id);
      if (data.data) {
        setInstructor(data.data);
        setTelefono(data.data.telefono || '');
        setEmail(data.data.email || '');
      } else {
        setError('No se pudo cargar tu información. Contacta al administrador.');
      }
    } catch (err) {
      console.error('Error al cargar instructor:', err);
      setError(err.response?.data?.error || 'Error al cargar tu información');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!instructor) return;
    
    setSavingProfile(true);
    setError('');
    setSuccess('');
    
    try {
      await updateInstructorProfile({ email, telefono });
      setSuccess('Perfil actualizado correctamente');
      setEditingProfile(false);
      await loadInstructor();
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada correctamente');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setError(err.response?.data?.error || 'Error al cambiar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSecurityQuestion = async () => {
    if (!preguntaSeguridad || !respuestaSeguridad.trim()) {
      setError('Por favor completa la pregunta y la respuesta');
      return;
    }

    if (respuestaSeguridad.trim().length < 2) {
      setError('La respuesta debe tener al menos 2 caracteres');
      return;
    }

    setSavingSecurityQuestion(true);
    setError('');
    setSuccess('');

    try {
      await setSecurityQuestion(preguntaSeguridad, respuestaSeguridad);
      setSuccess('Pregunta de seguridad configurada correctamente');
      setEditingSecurityQuestion(false);
      setPreguntaSeguridad('');
      setRespuestaSeguridad('');
      await loadSecurityQuestion();
    } catch (err) {
      console.error('Error al guardar pregunta de seguridad:', err);
      setError(err.response?.data?.error || 'Error al guardar pregunta de seguridad');
    } finally {
      setSavingSecurityQuestion(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user || user.rol !== 'instructor') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Acceso denegado. Esta página es solo para instructores.
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
                value={instructor?.nombre || ''}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                El nombre no se puede modificar. Contacta al administrador para cambios.
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
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setTelefono(value);
                }}
                className="w-full border rounded px-3 py-2"
                placeholder="123456789"
                pattern="[0-9]*"
                inputMode="numeric"
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
                  setTelefono(instructor?.telefono || '');
                  setEmail(instructor?.email || '');
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
            <p><strong>Nombre:</strong> {instructor?.nombre || 'N/A'}</p>
            <p><strong>Email:</strong> {instructor?.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {instructor?.telefono || 'No registrado'}</p>
            <p><strong>Estado:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                instructor?.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {instructor?.activo === 1 ? 'Activo' : 'Inactivo'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Pregunta de Seguridad */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pregunta de Seguridad</h2>
          {!editingSecurityQuestion && (
            <button
              onClick={() => {
                setEditingSecurityQuestion(true);
                setPreguntaSeguridad(preguntaActual || '');
                setError('');
                setSuccess('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {preguntaActual ? 'Editar' : 'Configurar'}
            </button>
          )}
        </div>

        {editingSecurityQuestion ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecciona una pregunta
              </label>
              <select
                value={preguntaSeguridad}
                onChange={(e) => setPreguntaSeguridad(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">-- Selecciona una pregunta --</option>
                {PREGUNTAS_DISPONIBLES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu Respuesta
              </label>
              <input
                type="text"
                value={respuestaSeguridad}
                onChange={(e) => setRespuestaSeguridad(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Ingresa tu respuesta"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta respuesta se usará para recuperar tu contraseña si la olvidas.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveSecurityQuestion}
                disabled={savingSecurityQuestion}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingSecurityQuestion ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setEditingSecurityQuestion(false);
                  setPreguntaSeguridad('');
                  setRespuestaSeguridad('');
                  setError('');
                }}
                disabled={savingSecurityQuestion}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            {preguntaActual ? (
              <div className="space-y-2">
                <p><strong>Pregunta configurada:</strong></p>
                <p className="text-gray-700">{preguntaActual}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>No has configurado una pregunta de seguridad</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Configura una pregunta de seguridad para poder recuperar tu contraseña si la olvidas.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cambiar Contraseña */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cambiar Contraseña</h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Ingresa tu contraseña actual"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Repite la nueva contraseña"
                required
                minLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                disabled={savingPassword}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



