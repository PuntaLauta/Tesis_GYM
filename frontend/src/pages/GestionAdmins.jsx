import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listUsuarios, createUsuario, updateUsuario, deleteUsuario, changePasswordUsuario } from '../services/usuarios';
import { listInstructores, changePasswordInstructor } from '../services/instructores';

export default function GestionAdmins() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [changingPassword, setChangingPassword] = useState(null);
  const [changingPasswordInstructor, setChangingPasswordInstructor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'admin'
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordDataInstructor, setPasswordDataInstructor] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await listUsuarios();
      // Filtrar solo admins y root
      const admins = (data.data || []).filter(u => u.rol === 'admin' || u.rol === 'root');
      setUsuarios(admins);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios');
    }
  };

  const loadInstructores = async () => {
    try {
      const data = await listInstructores();
      setInstructores(data.data || []);
    } catch (error) {
      console.error('Error al cargar instructores:', error);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUsuarios(), loadInstructores()]);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre || !formData.email || (!editingUsuario && !formData.password)) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (editingUsuario) {
        await updateUsuario(editingUsuario.id, formData.nombre, formData.email, formData.rol);
        setSuccess('Usuario actualizado correctamente');
      } else {
        await createUsuario(formData.nombre, formData.email, formData.password, formData.rol);
        setSuccess('Usuario creado correctamente');
      }
      setShowForm(false);
      setEditingUsuario(null);
      setFormData({ nombre: '', email: '', password: '', rol: 'admin' });
      await loadAll();
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      setError(err.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol
    });
    setShowForm(true);
    setError('');
    setSuccess('');
    
    // Scroll automático al formulario
    setTimeout(() => {
      const formElement = document.getElementById('formulario-admin');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await deleteUsuario(id);
      setSuccess('Usuario eliminado correctamente');
      await loadAll();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError(err.response?.data?.error || 'Error al eliminar usuario');
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

    try {
      await changePasswordUsuario(changingPassword.id, passwordData.password);
      setSuccess('Contraseña actualizada correctamente');
      setChangingPassword(null);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

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
        <h1 className="text-2xl font-bold">Gestion de Staff</h1>
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
          {/* Sección de Administradores */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Administradores</h2>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingUsuario(null);
                  setFormData({ nombre: '', email: '', password: '', rol: 'admin' });
                  setError('');
                  setSuccess('');
                  
                  // Scroll automático al formulario
                  setTimeout(() => {
                    const formElement = document.getElementById('formulario-admin');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Nuevo Administrador
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rol</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{usuario.nombre}</td>
                      <td className="px-4 py-3">{usuario.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          usuario.rol === 'root' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setChangingPassword(usuario);
                              
                              // Scroll automático al modal después de un pequeño delay
                              setTimeout(() => {
                                const modalElement = document.getElementById('modal-password');
                                if (modalElement) {
                                  modalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 100);
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                          >
                            Cambiar Pass
                          </button>
                          <button
                            onClick={() => handleDelete(usuario.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sección de Instructores */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Instructores</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Teléfono</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {instructores.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-center text-gray-500">
                        No hay instructores registrados
                      </td>
                    </tr>
                  ) : (
                    instructores.map((instructor) => (
                      <tr key={instructor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{instructor.nombre}</td>
                        <td className="px-4 py-3">{instructor.email}</td>
                        <td className="px-4 py-3">{instructor.telefono || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            instructor.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {instructor.activo === 1 ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {instructor.usuario_id && (
                              <button
                                onClick={() => {
                                  setChangingPasswordInstructor(instructor);
                                  setPasswordDataInstructor({ password: '', confirmPassword: '' });
                                  setError('');
                                  setSuccess('');
                                  
                                  // Scroll automático al modal después de un pequeño delay
                                  setTimeout(() => {
                                    const modalElement = document.getElementById('modal-password-instructor-staff');
                                    if (modalElement) {
                                      modalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }, 100);
                                }}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                              >
                                Cambiar Pass
                              </button>
                            )}
                            <Link
                              to="/admin/instructores"
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 inline-block"
                            >
                              Gestionar
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div id="formulario-admin" className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingUsuario ? 'Editar Administrador' : 'Nuevo Administrador'}
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
              />
            </div>
            {!editingUsuario && (
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Rol *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="admin">Admin</option>
                <option value="root">Root</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingUsuario ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUsuario(null);
                  setFormData({ nombre: '', email: '', password: '', rol: 'admin' });
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

      {/* Modal para cambiar contraseña de instructor */}
      {changingPasswordInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div id="modal-password-instructor-staff" className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Cambiar Contraseña - {changingPasswordInstructor.nombre}
            </h2>
            <form onSubmit={handleChangePasswordInstructor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Contraseña *</label>
                <input
                  type="password"
                  value={passwordDataInstructor.password}
                  onChange={(e) => setPasswordDataInstructor({ ...passwordDataInstructor, password: e.target.value })}
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
                  value={passwordDataInstructor.confirmPassword}
                  onChange={(e) => setPasswordDataInstructor({ ...passwordDataInstructor, confirmPassword: e.target.value })}
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
                    setChangingPasswordInstructor(null);
                    setPasswordDataInstructor({ password: '', confirmPassword: '' });
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

      {/* Modal para cambiar contraseña */}
      {changingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div id="modal-password" className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
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
    </div>
  );
}

