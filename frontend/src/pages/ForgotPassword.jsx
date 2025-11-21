import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSecurityQuestion, verifySecurityAnswer, recoverPassword } from '../services/auth';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: pregunta, 3: nueva contraseña, 4: éxito
  const [email, setEmail] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await getSecurityQuestion(email);
      setPregunta(data.pregunta);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo obtener la pregunta de seguridad. Verifica tu email.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!respuesta.trim()) {
      setError('Por favor ingresa tu respuesta');
      return;
    }

    setLoading(true);

    try {
      // Validar respuesta con el backend antes de avanzar
      await verifySecurityAnswer(email, respuesta);
      // Si la respuesta es correcta, avanzar al paso 3
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Respuesta incorrecta. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await recoverPassword(email, respuesta, newPassword);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al recuperar la contraseña. Verifica tu respuesta.');
      setStep(2); // Volver al paso de respuesta
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Recuperar Contraseña</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Paso 1: Ingresar email */}
      {step === 1 && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      )}

      {/* Paso 2: Responder pregunta de seguridad */}
      {step === 2 && (
        <form onSubmit={handleAnswerSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pregunta de Seguridad
            </label>
            <div className="bg-gray-50 border rounded px-3 py-2 text-gray-700">
              {pregunta}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu Respuesta
            </label>
            <input
              type="text"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ingresa tu respuesta"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Respuesta'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
                setRespuesta('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {/* Paso 3: Nueva contraseña */}
      {step === 3 && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Repite la contraseña"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep(2);
                setError('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {/* Paso 4: Éxito */}
      {step === 4 && (
        <div className="text-center space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">¡Contraseña recuperada exitosamente!</p>
            <p className="text-sm mt-1">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          </div>
          <Link
            to="/login"
            className="inline-block w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800"
          >
            Ir al Inicio de Sesión
          </Link>
        </div>
      )}
    </div>
  );
}

