import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listInstructores, createInstructor, updateInstructor, deleteInstructor, getClasesInstructor, changePasswordInstructor } from '../services/instructores';

export default function GestionInstructores() {
  const navigate = useNavigate();
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [changingPassword, setChangingPassword] = useState(null);
  const [viewingClases, setViewingClases] = useState(null);
  const [clasesInstructor, setClasesInstructor] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    activo: 1,
    crear_usuario: false,
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInstructores();
  }, []);

  const loadInstructores = async () => {
    setLoading(true);
    try {
      const data = await listInstructores();
      setInstructores(data.data || []);
    } catch (error) {
      console.error('Error al cargar instructores:', error);
      setError('Error al cargar instructores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre || !formData.email) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.crear_usuario && !formData.password) {
      setError('La contraseña es requerida si deseas crear un usuario');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (editingInstructor) {
        await updateInstructor(editingInstructor.id, formData);
        setSuccess('Instructor actualizado correctamente');
      } else {
        await createInstructor(formData);
        setSuccess('Instructor creado correctamente');
      }
      setShowForm(false);
      setEditingInstructor(null);
      setFormData({ nombre: '', email: '', telefono: '', activo: 1, crear_usuario: false, password: '' });
      await loadInstructores();
    } catch (err) {
      console.error('Error al guardar instructor:', err);
      setError(err.response?.data?.error || 'Error al guardar instructor');
    }
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      nombre: instructor.nombre,
      email: instructor.email,
      telefono: instructor.telefono || '',
      activo: instructor.activo,
      crear_usuario: false,
      password: ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
    
    // Scroll automático al formulario
    setTimeout(() => {
      const formElement = document.getElementById('formulario-instructor');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este instructor?')) {
      return;
    }

    try {
      await deleteInstructor(id);
      setSuccess('Instructor eliminado correctamente');
      await loadInstructores();
    } catch (err) {
      console.error('Error al eliminar instructor:', err);
      setError(err.response?.data?.error || 'Error al eliminar instructor');
    }
  };

  const handleVerClases = async (instructor) => {
    setViewingClases(instructor);
    try {
      const data = await getClasesInstructor(instructor.id);
      setClasesInstructor(data.data || []);
    } catch (error) {
      console.error('Error al cargar clases:', error);
      alert('Error al cargar clases del instructor');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.password || !passwordData.confirmPassword) {
      setError('Por favor completa ambos campos de contraseña');
      return;
    }

    if (passwordData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!changingPassword.usuario_id) {
      setError('Este instructor no tiene un usuario asociado');
      return;
    }

    try {
      await changePasswordInstructor(changingPassword.usuario_id, passwordData.password);
      setSuccess('Contraseña actualizada correctamente');
      setChangingPassword(null);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const instructoresFiltrados = instructores.filter(instructor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      instructor.nombre.toLowerCase().includes(term) ||
      instructor.email.toLowerCase().includes(term) ||
      (instructor.telefono && instructor.telefono.includes(term))
    );
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion de Instructores</h1>
        <button
          onClick={() => navigate('/root')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Volver
        </button>
      </div>

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

      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingInstructor(null);
                setFormData({ nombre: '', email: '', telefono: '', activo: 1, crear_usuario: false, password: '' });
                setError('');
                setSuccess('');
                
                // Scroll automático al formulario
                setTimeout(() => {
                  const formElement = document.getElementById('formulario-instructor');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo Instructor
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="space-y-4">
                  {instructoresFiltrados.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                      {searchTerm ? 'No se encontraron instructores con ese criterio' : 'No hay instructores registrados'}
                    </div>
                  ) : (
                    instructoresFiltrados.map((instructor) => (
                      <div key={instructor.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold">{instructor.nombre}</h3>
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              {instructor.telefono && <div>Telefono: {instructor.telefono}</div>}
                              <div>
                                <label className="font-medium">Email:</label>
                                <input
                                  type="email"
                                  value={instructor.email}
                                  disabled
                                  className="ml-2 border rounded px-2 py-1 bg-gray-100 text-gray-600"
                                />
                              </div>
                            </div>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                              instructor.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {instructor.activo === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <div className="flex flex-col md:flex-row gap-2 ml-4">
                            <button
                              onClick={() => handleVerClases(instructor)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 whitespace-nowrap"
                            >
                              Ver Clases
                            </button>
                            <button
                              onClick={() => handleEdit(instructor)}
                              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 whitespace-nowrap"
                            >
                              Editar
                            </button>
                            {instructor.usuario_id && (
                              <button
                                onClick={() => {
                                  setChangingPassword(instructor);
                                  setPasswordData({ password: '', confirmPassword: '' });
                                  setError('');
                                  setSuccess('');
                                  
                                  // Scroll automático al modal después de un pequeño delay
                                  setTimeout(() => {
                                    const modalElement = document.getElementById('modal-password-instructor');
                                    if (modalElement) {
                                      modalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }, 100);
                                }}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 whitespace-nowrap"
                              >
                                Cambiar Pass
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(instructor.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 whitespace-nowrap"
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
            </div>
          )}
        </>
      ) : (
        <div id="formulario-instructor" className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingInstructor ? 'Editar Instructor' : 'Nuevo Instructor'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
                disabled={!!editingInstructor}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, telefono: value });
                }}
                className="w-full border rounded px-3 py-2"
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>
            {!editingInstructor && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="crear_usuario"
                    checked={formData.crear_usuario}
                    onChange={(e) => setFormData({ ...formData, crear_usuario: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="crear_usuario" className="text-sm">
                    Crear usuario con credenciales de acceso
                  </label>
                </div>
                {formData.crear_usuario && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required={formData.crear_usuario}
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingInstructor ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingInstructor(null);
                  setFormData({ nombre: '', email: '', telefono: '', activo: 1, crear_usuario: false, password: '' });
                  setError('');
                  setSuccess('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para cambiar contraseña */}
      {changingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div id="modal-password-instructor" className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Cambiar Contraseña - {changingPassword.nombre}
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Contraseña *</label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Contraseña *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Cambiar Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangingPassword(null);
                    setPasswordData({ password: '', confirmPassword: '' });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Clases del Instructor */}
      {viewingClases && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Clases de {viewingClases.nombre}</h2>
                </div>
                <button
                  onClick={() => {
                    setViewingClases(null);
                    setClasesInstructor([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {clasesInstructor.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Este instructor no tiene clases asignadas</div>
              ) : (
                <div className="space-y-3">
                  {clasesInstructor.map((clase) => (
                    <div key={clase.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{clase.nombre || clase.tipo_descripcion}</div>
                      <div className="text-sm text-gray-600">
                        {clase.fecha} • {clase.hora_inicio} - {clase.hora_fin}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Ocupación: {clase.ocupados || 0}/{clase.cupo} ({clase.porcentaje || 0}%)
                      </div>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          clase.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {clase.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

