export default function RutinaCard({ rutina, onView, onEdit, onDelete, onToggleActiva }) {
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'No especificada';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  let ejercicios = [];
  try {
    ejercicios = typeof rutina.ejercicios === 'string' 
      ? JSON.parse(rutina.ejercicios) 
      : rutina.ejercicios || [];
  } catch (e) {
    ejercicios = [];
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {rutina.nombre}
          </h3>
          {rutina.descripcion && (
            <p className="text-sm text-gray-600 mb-2">{rutina.descripcion}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            rutina.activa === 1 || rutina.activa === true
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {rutina.activa === 1 || rutina.activa === true ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-3 space-y-1">
        {rutina.fecha_inicio && (
          <p>
            <strong>Inicio:</strong> {formatFecha(rutina.fecha_inicio)}
          </p>
        )}
        {rutina.fecha_fin && (
          <p>
            <strong>Fin:</strong> {formatFecha(rutina.fecha_fin)}
          </p>
        )}
        <p>
          <strong>Ejercicios:</strong> {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {onView && (
          <button
            onClick={() => onView(rutina)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Ver
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(rutina)}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Editar
          </button>
        )}
        {onToggleActiva && (
          <button
            onClick={() => onToggleActiva(rutina)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              rutina.activa === 1 || rutina.activa === true
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {rutina.activa === 1 || rutina.activa === true ? 'Desactivar' : 'Activar'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(rutina)}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}


