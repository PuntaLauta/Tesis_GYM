export default function ChatMessage({ mensaje, esUsuario, fecha }) {
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          esUsuario
            ? 'bg-blue-600 text-white'
            : 'bg-[#0b1533] text-blue-50'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{mensaje}</div>
        {fecha && (
          <div
            className={`text-xs mt-1 ${
              esUsuario ? 'text-blue-100' : 'text-blue-200'
            }`}
          >
            {formatFecha(fecha)}
          </div>
        )}
      </div>
    </div>
  );
}


