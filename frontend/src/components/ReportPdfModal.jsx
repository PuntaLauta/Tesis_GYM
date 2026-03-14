import { useState, useEffect } from 'react';

const SECTION_IDS = [
  { id: 'ingresos', label: 'Ingresos', hasAgrupacion: true, agrupacionLabel: 'Agrupar por' },
  { id: 'clasesPopulares', label: 'Clases Más Populares', hasAgrupacion: false },
  { id: 'ocupacion', label: 'Ocupación de Clases', hasTipoClase: true },
  { id: 'accesos', label: 'Control de Accesos', hasAgrupacion: true, agrupacionLabel: 'Agrupar por' },
  { id: 'estadoSocios', label: 'Estado de Socios', hasAgrupacion: false },
];

function getDefaultSectionConfig(defaultFilters) {
  return {
    ingresos: { included: true, desde: defaultFilters.desde, hasta: defaultFilters.hasta, agrupacion: 'semana' },
    clasesPopulares: { included: true, desde: defaultFilters.desde, hasta: defaultFilters.hasta },
    ocupacion: { included: true, desde: defaultFilters.desde, hasta: defaultFilters.hasta, tipo_clase_id: '' },
    accesos: { included: true, desde: defaultFilters.desde, hasta: defaultFilters.hasta, agrupacion: 'semana' },
    estadoSocios: { included: true, desde: defaultFilters.desde, hasta: defaultFilters.hasta },
  };
}

export default function ReportPdfModal({ open, onClose, onGenerate, defaultFilters, tiposClase = [] }) {
  const [config, setConfig] = useState(() => getDefaultSectionConfig(defaultFilters || {}));
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (open) {
      setConfig(getDefaultSectionConfig(defaultFilters || {}));
    }
  }, [open, defaultFilters?.desde, defaultFilters?.hasta]);

  const updateSection = (sectionId, updates) => {
    setConfig((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], ...updates },
    }));
  };

  const handleGenerate = () => {
    onGenerate(config);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Personalizar reporte PDF</h2>
          <p className="text-sm text-gray-600 mt-1">Elige las secciones y filtros para el reporte.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {SECTION_IDS.map(({ id, label, hasAgrupacion, agrupacionLabel, hasTipoClase }) => {
            const section = config[id] || {};
            const isExpanded = expandedId === id;
            const isIncluded = section.included !== false;
            return (
              <div key={id} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-gray-800"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                >
                  <span>{label}</span>
                  <span className="text-gray-500 text-sm">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>
                {isExpanded && (
                  <div className="p-3 border-t bg-white space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!isIncluded}
                        onChange={(e) => updateSection(id, { included: !e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">No incluir esta sección</span>
                    </label>
                    {!isIncluded && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                        Esta sección no se incluirá en el PDF.
                      </p>
                    )}
                    {isIncluded && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Desde</label>
                            <input
                              type="date"
                              value={section.desde || ''}
                              onChange={(e) => updateSection(id, { desde: e.target.value })}
                              className="w-full border rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                            <input
                              type="date"
                              value={section.hasta || ''}
                              onChange={(e) => updateSection(id, { hasta: e.target.value })}
                              className="w-full border rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                        {hasAgrupacion && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">{agrupacionLabel}</label>
                            <select
                              value={section.agrupacion || 'semana'}
                              onChange={(e) => updateSection(id, { agrupacion: e.target.value })}
                              className="w-full border rounded px-2 py-1.5 text-sm"
                            >
                              <option value="dia">Día</option>
                              <option value="semana">Semana</option>
                              <option value="mes">Mes</option>
                              <option value="anio">Año</option>
                            </select>
                          </div>
                        )}
                        {hasTipoClase && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Tipo de clase</label>
                            <select
                              value={section.tipo_clase_id || ''}
                              onChange={(e) => updateSection(id, { tipo_clase_id: e.target.value })}
                              className="w-full border rounded px-2 py-1.5 text-sm"
                            >
                              <option value="">Todos</option>
                              {tiposClase.map((t) => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generar
          </button>
        </div>
      </div>
    </div>
  );
}

export { getDefaultSectionConfig };
