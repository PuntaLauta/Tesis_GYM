// Convierte **texto** en negrita y respeta saltos de línea; devuelve array de nodos React
function renderizarConNegrita(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  const partes = texto.split(/\*\*(.+?)\*\*/g);
  const resultado = [];
  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i];
    if (i % 2 === 1) {
      resultado.push(<strong key={i}>{parte}</strong>);
    } else if (parte) {
      resultado.push(parte);
    }
  }
  return resultado.length === 1 ? resultado[0] : resultado;
}

function renderizarMarkdownSimple(texto) {
  if (!texto || typeof texto !== 'string') return texto;

  return texto.split('\n').map((linea, index) => {
    const lineaNormalizada = linea.replace(/\\([#*`_\-])/g, '$1');
    const textoLinea = lineaNormalizada.trim();

    if (/^---+$/.test(textoLinea)) {
      return <hr key={`hr-${index}`} className="border-blue-200/30 my-2" />;
    }

    if (textoLinea.startsWith('### ')) {
      return (
        <h4 key={`h3-${index}`} className="text-sm font-semibold mt-2 mb-1">
          {renderizarConNegrita(textoLinea.replace(/^###\s+/, ''))}
        </h4>
      );
    }

    if (textoLinea.startsWith('## ')) {
      return (
        <h3 key={`h2-${index}`} className="text-base font-bold mt-2 mb-1">
          {renderizarConNegrita(textoLinea.replace(/^##\s+/, ''))}
        </h3>
      );
    }

    if (textoLinea.startsWith('# ')) {
      return (
        <h2 key={`h1-${index}`} className="text-lg font-bold mt-1 mb-1">
          {renderizarConNegrita(textoLinea.replace(/^#\s+/, ''))}
        </h2>
      );
    }

    if (/^[-*]\s+/.test(textoLinea)) {
      return (
        <p key={`li-${index}`} className="mb-1 pl-2">
          • {renderizarConNegrita(textoLinea.replace(/^[-*]\s+/, ''))}
        </p>
      );
    }

    return (
      <p key={`p-${index}`} className="mb-1">
        {renderizarConNegrita(lineaNormalizada)}
      </p>
    );
  });
}

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
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'} mb-4 ${esUsuario ? 'pr-2 sm:pr-0' : ''}`}>
      <div
        className={`${esUsuario ? 'max-w-[90%] sm:max-w-[80%]' : 'max-w-[80%]'} rounded-lg p-3 ${
          esUsuario
            ? 'bg-blue-600 text-white'
            : 'bg-[#0b1533] text-blue-50'
        }`}
      >
        <div className="break-words">
          {esUsuario ? renderizarConNegrita(mensaje) : renderizarMarkdownSimple(mensaje)}
        </div>
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


