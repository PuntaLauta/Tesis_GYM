import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listMine, cancelReservation } from "../services/reservations";
import { getMySocio, downloadQr } from '../services/socios';
import { listMyPayments } from '../services/pagos';
import Chatbox from '../components/Chatbox';

import LandingPage from "./LandingPage";

export default function Home() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socio, setSocio] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [loadingSocio, setLoadingSocio] = useState(true);
  const [error, setError] = useState('');
  const [qrError, setQrError] = useState('');
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);

  useEffect(() => {
    if (user && user.rol === 'cliente') {
      loadSocio();
      loadReservas();
      loadPagos();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
  }, [qrUrl]);

  const formatSocioId = (socio) => {
    if (!socio) return '';
    return socio.documento || String(socio.id).padStart(4, '0');
  };

  const loadSocio = async () => {
    setLoadingSocio(true);
    setError('');
    try {
      const data = await getMySocio();
      if (data.data) {
        setSocio(data.data);
        // Solo cargar QR si el socio está activo
        if (data.data.estado === 'activo') {
          loadQr(data.data.id);
        } else {
          setQrError('Tu cuenta está inactiva. Contacta a recepción para reactivar tu membresía.');
        }
      } else {
        setError('No tienes un socio asociado. Contacta al administrador.');
      }
    } catch (err) {
      console.error('Error al cargar socio:', err);
      setError(err.response?.data?.error || 'Error al cargar tu información');
    } finally {
      setLoadingSocio(false);
    }
  };

  const loadQr = async (socioId) => {
    try {
      setQrError('');
      const blob = await downloadQr(socioId);
      const url = URL.createObjectURL(blob);
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
      setQrUrl(url);
    } catch (err) {
      console.error('Error al cargar QR:', err);
      setQrError(err.response?.data?.error || 'No se pudo cargar el QR');
    }
  };

  const loadReservas = async () => {
    setLoading(true);
    try {
      const data = await listMine();
      setReservas(data.data || []);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const loadPagos = async () => {
    setLoadingPagos(true);
    try {
      const data = await listMyPayments();
      setPagos(data.data || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoadingPagos(false);
    }
  };

  const handleCancelarReserva = async () => {
    if (!reservaACancelar) return;

    setCancelando(true);
    try {
      await cancelReservation(reservaACancelar.id);
      setReservaACancelar(null);
      // Recargar reservas
      await loadReservas();
    } catch (err) {
      console.error('Error al cancelar reserva:', err);
      alert(err.response?.data?.error || 'Error al cancelar la reserva');
    } finally {
      setCancelando(false);
    }
  };

  // Función para calcular días hasta vencimiento
  const getDiasHastaVencimiento = () => {
    if (!socio || !socio.fecha_vencimiento) return null;
    const fechaVencimiento = new Date(socio.fecha_vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVencimiento.setHours(0, 0, 0, 0);
    const diffTime = fechaVencimiento - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const diasHastaVencimiento = getDiasHastaVencimiento();

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {user.rol === 'cliente' && (
        <div className="text-center mb-8 animate-fade-in-up">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Tu panel personal</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
            Bienvenido a <span className="text-blue-600">FitSense</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Gestioná tus reservas, pagos y rutinas desde un solo lugar. Mantente al día con tu membresía
            y accedé a tu asistente virtual cuando lo necesites.
          </p>
        </div>
      )}
      {user.rol === 'cliente' ? (
        <div className="space-y-6">
          {loadingSocio ? (
            <div className="text-center py-8 text-gray-500">Cargando información...</div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <>
              {/* Notificaciones proactivas de vencimiento */}
              {diasHastaVencimiento !== null && diasHastaVencimiento <= 7 && socio && socio.estado === 'activo' && (
                <div className={`border-l-4 p-4 rounded-lg shadow ${diasHastaVencimiento <= 0
                    ? 'bg-red-50 border-red-400'
                    : diasHastaVencimiento <= 3
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${diasHastaVencimiento <= 0
                          ? 'text-red-400'
                          : diasHastaVencimiento <= 3
                            ? 'text-orange-400'
                            : 'text-yellow-400'
                        }`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className={`text-sm font-medium mb-2 ${diasHastaVencimiento <= 0
                          ? 'text-red-800'
                          : diasHastaVencimiento <= 3
                            ? 'text-orange-800'
                            : 'text-yellow-800'
                        }`}>
                        {diasHastaVencimiento <= 0
                          ? '⚠️ Membresía Vencida'
                          : diasHastaVencimiento <= 3
                            ? '⚠️ Membresía Próxima a Vencer'
                            : '📅 Recordatorio de Pago'}
                      </h3>
                      <div className={`text-sm ${diasHastaVencimiento <= 0
                          ? 'text-red-700'
                          : diasHastaVencimiento <= 3
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                        }`}>
                        {diasHastaVencimiento <= 0 ? (
                          <p>
                            Tu membresía venció hace {Math.abs(diasHastaVencimiento)} {Math.abs(diasHastaVencimiento) === 1 ? 'día' : 'días'}.
                            Por favor, realiza el pago para reactivar tu acceso.
                          </p>
                        ) : diasHastaVencimiento <= 3 ? (
                          <p>
                            Tu membresía vence en {diasHastaVencimiento} {diasHastaVencimiento === 1 ? 'día' : 'días'}.
                            Realiza el pago para mantener tu acceso activo.
                          </p>
                        ) : (
                          <p>
                            Tu membresía vence en {diasHastaVencimiento} días.
                            Recuerda realizar el pago antes del vencimiento.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notificaciones de clases canceladas */}
              {reservas.filter(r => r.clase_estado === 'cancelada').length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-yellow-800 mb-2">
                        Clases Canceladas
                      </h3>
                      <div className="text-sm text-yellow-700">
                        {reservas.filter(r => r.clase_estado === 'cancelada').map((reserva) => (
                          <p key={reserva.id} className="mb-1">
                            • <strong>{reserva.clase_nombre}</strong> - {formatFecha(reserva.fecha)} a las {reserva.hora_inicio}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contenedor flex para Mi Información y Mis Clases Reservadas */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Información del Socio */}
                {socio && (
                  <div className="bg-white p-6 rounded-lg shadow flex-1">
                    <h2 className="text-xl font-semibold mb-4">Mi Información</h2>
                    <div className="space-y-2">
                      <p><strong>Documento:</strong> {formatSocioId(socio)}</p>
                      <p><strong>Nombre:</strong> {socio.nombre}</p>
                      {socio.telefono && <p><strong>Teléfono:</strong> {socio.telefono}</p>}
                      <p><strong>Estado:</strong>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${socio.estado === 'activo' ? 'bg-green-100 text-green-800' :
                            socio.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {socio.estado}
                        </span>
                      </p>
                      {socio.plan_nombre && (
                        <>
                          <p><strong>Plan:</strong> {socio.plan_nombre}</p>
                          {socio.fecha_vencimiento && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              {(() => {
                                const fechaVencimiento = new Date(socio.fecha_vencimiento);
                                const hoy = new Date();
                                hoy.setHours(0, 0, 0, 0);
                                fechaVencimiento.setHours(0, 0, 0, 0);
                                const diffTime = fechaVencimiento - hoy;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                return (
                                  <p className="text-sm text-gray-700 mb-2">
                                    <strong>Próximo vencimiento:</strong> {fechaVencimiento.toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                    {diffDays > 0 && (
                                      <span className="ml-2 text-blue-700 font-semibold">
                                        ({diffDays} {diffDays === 1 ? 'día' : 'días'} restantes)
                                      </span>
                                    )}
                                    {diffDays === 0 && (
                                      <span className="ml-2 text-orange-600 font-semibold">
                                        (Vence hoy)
                                      </span>
                                    )}
                                    {diffDays < 0 && (
                                      <span className="ml-2 text-red-600 font-semibold">
                                        (Vencido hace {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'día' : 'días'})
                                      </span>
                                    )}
                                  </p>
                                );
                              })()}
                              {socio.plan_precio && (
                                <p className="text-sm text-gray-700 mb-3">
                                  <strong>Monto a pagar:</strong> ${socio.plan_precio.toLocaleString('es-ES')}
                                </p>
                              )}
                              <div className="flex items-center gap-3 flex-wrap">
                                <button
                                  onClick={() => {
                                    alert('Sistema de pagos próximamente. Esta funcionalidad estará disponible pronto.');
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  Pagar
                                </button>
                                <span className="text-xs text-gray-600">
                                  Efectivo o transferencia, consultar en recepción
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Clases Reservadas */}
                <div className="bg-white p-6 rounded-lg shadow flex-1 flex flex-col">
                  <h2 className="text-xl font-semibold mb-4">Mis Clases Reservadas</h2>
                  {loading ? (
                    <div className="text-center py-4 text-gray-500">Cargando...</div>
                  ) : reservas.length === 0 ? (
                    <div className="text-center py-8">
                      {socio && socio.estado !== 'activo' ? (
                        <>
                          <p className="text-red-600 font-medium mb-2">Cuenta inactiva</p>
                          <p className="text-gray-500 mb-4">
                            No puedes reservar clases porque tu cuenta está inactiva.
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            Contacta a recepción para reactivar tu membresía.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-500 mb-4">No tienes clases reservadas.</p>
                          <Link to="/classes" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Ver Clases Disponibles
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                      <div className="space-y-4">
                        {reservas.map((reserva) => (
                          <div
                            key={reserva.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{reserva.clase_nombre}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>Fecha:</strong> {formatFecha(reserva.fecha)}</p>
                                  <p><strong>Horario:</strong> {reserva.hora_inicio} - {reserva.hora_fin}</p>
                                  {reserva.instructor && (
                                    <p><strong>Instructor:</strong> {reserva.instructor}</p>
                                  )}
                                </div>
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-1 rounded text-xs ${reserva.estado === 'reservado' ? 'bg-blue-100 text-blue-800' :
                                      reserva.estado === 'asistio' ? 'bg-green-100 text-green-800' :
                                        reserva.estado === 'ausente' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                    }`}>
                                    {reserva.estado === 'reservado' ? 'Reservado' :
                                      reserva.estado === 'asistio' ? 'Asistió' :
                                        reserva.estado === 'ausente' ? 'Ausente' :
                                          reserva.estado}
                                  </span>
                                  {reserva.clase_estado === 'cancelada' && (
                                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                      Clase Cancelada
                                    </span>
                                  )}
                                  {reserva.estado === 'reservado' && reserva.clase_estado !== 'cancelada' && (
                                    <button
                                      onClick={() => setReservaACancelar(reserva)}
                                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reservas.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        to="/classes"
                        className="text-blue-600 hover:underline"
                      >
                        Ver todas las clases disponibles →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Código QR - Solo mostrar si el socio está activo */}
              {socio && socio.estado === 'activo' ? (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Mi Código QR de Acceso</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Muestra este código QR al llegar al gimnasio para verificar tu acceso.
                  </p>

                  {qrUrl ? (
                    <div className="text-center">
                      <img
                        src={qrUrl}
                        alt="Mi QR de Acceso"
                        className="mx-auto border rounded mb-4"
                        style={{ maxWidth: '300px' }}
                      />
                      <button
                        onClick={async () => {
                          try {
                            const blob = await downloadQr(socio.id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `mi-qr-gym.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            alert('Error al descargar QR');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Descargar QR
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {qrError ? <span className="text-red-600">{qrError}</span> : 'Cargando QR...'}
                    </div>
                  )}
                  {qrError && <div className="text-center text-red-600 text-sm mt-2">{qrError}</div>}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Mi Código QR de Acceso</h2>
                  <div className="text-center py-4">
                    <p className="text-red-600 font-medium mb-2">Cuenta inactiva</p>
                    <p className="text-sm text-gray-600">
                      Tu código QR no está disponible porque tu cuenta está inactiva.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Contacta a recepción para reactivar tu membresía.
                    </p>
                  </div>
                </div>
              )}

              {/* Historial de Pagos */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Historial de Pagos</h2>
                {loadingPagos ? (
                  <div className="text-center py-4 text-gray-500">Cargando...</div>
                ) : pagos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No tienes pagos registrados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pagos.map((pago) => (
                      <div
                        key={pago.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-lg">
                                ${pago.monto.toLocaleString('es-ES')}
                              </span>
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                Pagado
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Fecha de pago:</strong> {formatFecha(pago.fecha)}</p>
                              {pago.plan_nombre && (
                                <p><strong>Plan:</strong> {pago.plan_nombre}</p>
                              )}
                              {pago.periodo_inicio && pago.periodo_fin && (
                                <p className="text-xs text-gray-500">
                                  Período: {formatFecha(pago.periodo_inicio)} - {formatFecha(pago.periodo_fin)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal de Confirmación */}
              {reservaACancelar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-semibold mb-4">Confirmar Cancelación</h3>
                    <p className="text-gray-700 mb-4">
                      ¿Estás seguro de que deseas cancelar tu reserva para la clase <strong>{reservaACancelar.clase_nombre}</strong>?
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                      Fecha: {formatFecha(reservaACancelar.fecha)}<br />
                      Horario: {reservaACancelar.hora_inicio} - {reservaACancelar.hora_fin}
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setReservaACancelar(null)}
                        disabled={cancelando}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCancelarReserva}
                        disabled={cancelando}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {cancelando ? 'Eliminando...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Chatbox flotante solo para clientes */}
          {user && user.rol === 'cliente' && <Chatbox />}
        </div>
      ) : (
        <div className="space-y-2">
          <p>Hola, <b>{user.nombre}</b>. Tu rol es <b>{user.rol}</b>.</p>
          <p>Usá el menú para ir a tu dashboard.</p>
        </div>
      )}
    </div>
  );
}
