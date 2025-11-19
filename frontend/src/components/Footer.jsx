export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sección: Información General */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Información</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Gestión GYM</strong> - Sistema de gestión para gimnasios
              </p>
              <p>
                Para asistencia, contacta directamente a recepción del gimnasio.
              </p>
            </div>
          </div>

          {/* Sección: Ayuda Rápida */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Ayuda Rápida</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>¿Olvidaste tu contraseña?</strong></p>
              <p className="ml-4">Contacta a recepción para recuperarla.</p>
              
              <p className="mt-3"><strong>¿Cómo reservo una clase?</strong></p>
              <p className="ml-4">Ve a "Clases" y haz clic en "Reservar".</p>
              
              <p className="mt-3"><strong>¿Dónde veo mi código QR?</strong></p>
              <p className="ml-4">En tu página principal, sección "Mi Código QR de Acceso".</p>
              
              <p className="mt-3"><strong>¿Cómo pago mi membresía?</strong></p>
              <p className="ml-4">Haz clic en "Pagar" en tu información de membresía. Efectivo o transferencia, consulta en recepción.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>© 2024 Gestión GYM. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

