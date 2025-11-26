import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  const renderFAQ = () => {
    // FAQ para usuarios no logueados
    if (!user) {
      return (
        <div className="space-y-2 text-sm text-gray-300">
          <p><strong>¿Como inicio sesion?</strong></p>
          <p className="ml-4">Usa tu email y contraseña en la pagina de login.</p>
          
          <p className="mt-3"><strong>¿Olvidaste tu contraseña?</strong></p>
          <p className="ml-4">Haz clic en "¿Olvidaste tu contraseña?" en la pagina de login y sigue los pasos.</p>
          
          <p className="mt-3"><strong>¿Necesitas ayuda?</strong></p>
          <p className="ml-4">Contacta a recepcion del gimnasio o envianos un email.</p>
        </div>
      );
    }

    // FAQ para clientes
    if (user.rol === 'cliente') {
      return (
        <div className="space-y-2 text-sm text-gray-300">
          <p><strong>¿Como reservo una clase?</strong></p>
          <p className="ml-4">Ve a "Clases" y haz clic en "Reservar".</p>
          
          <p className="mt-3"><strong>¿Donde veo mi codigo QR?</strong></p>
          <p className="ml-4">En tu pagina principal, seccion "Mi Codigo QR de Acceso".</p>
          
          <p className="mt-3"><strong>¿Como pago mi membresia?</strong></p>
          <p className="ml-4">Haz clic en "Pagar" en tu informacion de membresia. Efectivo o transferencia, consulta en recepcion.</p>
          
          <p className="mt-3"><strong>¿Como cambio mi contraseña?</strong></p>
          <p className="ml-4">Ve a "Mi Perfil" y usa la opcion "Cambiar Contraseña".</p>
          
          <p className="mt-3"><strong>¿Puedo editar mi perfil?</strong></p>
          <p className="ml-4">Si, desde "Mi Perfil" puedes actualizar tu email y telefono.</p>
        </div>
      );
    }

    // FAQ para administradores
    if (user.rol === 'admin' || user.rol === 'root') {
      return (
        <div className="space-y-2 text-sm text-gray-300">
          <p><strong>¿Como gestiono socios?</strong></p>
          <p className="ml-4">Ve a "Socios" para ver, crear, editar y gestionar el estado de los socios.</p>
          
          <p className="mt-3"><strong>¿Como creo una clase?</strong></p>
          <p className="ml-4">Ve a "Clases" y haz clic en "Nueva Clase". Completa los datos y guarda.</p>
          
          <p className="mt-3"><strong>¿Como registro un pago?</strong></p>
          <p className="ml-4">Ve a "Pagos" y haz clic en "Nuevo Pago". Selecciona el socio y completa los datos.</p>
          
          <p className="mt-3"><strong>¿Como verifico accesos por QR?</strong></p>
          <p className="ml-4">Ve a "Accesos" y pega el token del QR para verificar o registrar el acceso.</p>
          
          <p className="mt-3"><strong>¿Donde veo reportes?</strong></p>
          <p className="ml-4">Ve a "Reportes" para ver estadisticas y resumenes del gimnasio.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sección: Información de Contacto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Telefono:</strong><br />
                <a href="tel:381000000" className="hover:text-white">381 000000</a>
              </p>
              <p>
                <strong>Email:</strong><br />
                <a href="mailto:soporte.am@gmail.com" className="hover:text-white break-all">soporte.am@gmail.com</a>
              </p>
              <p>
                <strong>Direccion:</strong><br />
                Maipu 490
              </p>
              <p>
                <strong>Horarios:</strong><br />
                Lunes a viernes: 7:00 a 23:00<br />
                Sabados: 8:00 a 20:00
              </p>
            </div>
          </div>

          {/* Sección: Redes Sociales */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Siguenos</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <a 
                  href="https://www.instagram.com/am_gym_69/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white underline"
                >
                  Instagram
                </a>
              </p>
            </div>
          </div>

          {/* Sección: Ayuda Rápida (Contextual) */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Ayuda Rapida</h3>
            {renderFAQ()}
          </div>

          {/* Sección: Enlaces Rápidos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces</h3>
            <div className="space-y-2 text-sm text-gray-300">
              {user && user.rol === 'cliente' && (
                <>
                  <p>
                    <a href="/" className="hover:text-white underline">Inicio</a>
                  </p>
                  <p>
                    <a href="/profile" className="hover:text-white underline">Mi Perfil</a>
                  </p>
                  <p>
                    <a href="/classes" className="hover:text-white underline">Clases</a>
                  </p>
                  <p>
                    <button onClick={handleLogout} className="hover:text-white underline text-left">
                      Cerrar Sesion
                    </button>
                  </p>
                </>
              )}
              {user && (user.rol === 'admin' || user.rol === 'root') && (
                <>
                  <p>
                    <a href="/dashboard" className="hover:text-white underline">Dashboard</a>
                  </p>
                  <p>
                    <a href="/socios" className="hover:text-white underline">Socios</a>
                  </p>
                  <p>
                    <a href="/classes" className="hover:text-white underline">Clases</a>
                  </p>
                  <p>
                    <button onClick={handleLogout} className="hover:text-white underline text-left">
                      Cerrar Sesion
                    </button>
                  </p>
                </>
              )}
              {!user && (
                <>
                  <p>
                    <a href="/login" className="hover:text-white underline">Iniciar Sesion</a>
                  </p>
                  <p>
                    <a href="/forgot-password" className="hover:text-white underline">Recuperar Contraseña</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>© 2025 Gestión GYM. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

