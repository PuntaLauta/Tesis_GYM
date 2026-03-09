import { useState, useEffect } from 'react';
import { 
  getActivosInactivos, 
  getVencenSemana, 
  getIngresos, 
  getOcupacionClases,
  getAccesos,
  getSociosActivos,
  getClasesPopulares,
  getMetodosPago,
  exportReportToCSV,
  exportAllReportsToZip
} from '../services/reports';
import StatCards from '../components/StatCards';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [vencen, setVencen] = useState([]);
  const [ingresos, setIngresos] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [accesos, setAccesos] = useState(null);
  const [sociosActivos, setSociosActivos] = useState([]);
  const [clasesPopulares, setClasesPopulares] = useState([]);
  const [metodosPago, setMetodosPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Últimos 30 días
    hasta: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [
        activosData, 
        vencenData, 
        ingresosData, 
        ocupacionData,
        accesosData,
        sociosActivosData,
        clasesPopularesData,
        metodosPagoData
      ] = await Promise.all([
        getActivosInactivos(),
        getVencenSemana(),
        getIngresos(filters),
        getOcupacionClases(filters),
        getAccesos(filters),
        getSociosActivos(),
        getClasesPopulares(),
        getMetodosPago(filters),
      ]);

      setStats(activosData.data);
      setVencen(vencenData.data || []);
      setIngresos(ingresosData.data);
      setOcupacion(ocupacionData.data);
      setAccesos(accesosData.data);
      setSociosActivos(sociosActivosData.data || []);
      setClasesPopulares(clasesPopularesData.data || []);
      setMetodosPago(metodosPagoData.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPrintView = () => {
    const fechaGen = new Date().toLocaleString('es-AR');
    const rangoFechas = filters.desde && filters.hasta ? `${filters.desde} a ${filters.hasta}` : 'Sin filtro';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reportes - Impresión</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin: 16px 0 8px; border-bottom: 1px solid #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; }
    .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
    .stats-grid { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .stat-box { border: 1px solid #333; padding: 8px 12px; min-width: 120px; }
    .empty { color: #999; font-style: italic; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>Reportes del Gimnasio</h1>
  <div class="meta">Generado: ${fechaGen} | Período: ${rangoFechas}</div>

  <h2>Resumen General</h2>
  <div class="stats-grid">
    ${stats ? `
    <div class="stat-box">Socios Activos: <strong>${stats.activos ?? '-'}</strong></div>
    <div class="stat-box">Socios Inactivos: <strong>${stats.inactivos ?? '-'}</strong></div>
    <div class="stat-box">Total: <strong>${stats.total ?? (stats.activos + stats.inactivos) ?? '-'}</strong></div>
    ` : ''}
    ${ingresos ? `<div class="stat-box">Ingresos: <strong>$${ingresos.total?.toFixed(2) ?? '0.00'}</strong></div>` : ''}
    ${ocupacion ? `<div class="stat-box">Ocupación Promedio: <strong>${ocupacion.promedio ?? 0}%</strong></div>` : ''}
  </div>

  <h2>Vencen esta semana</h2>
  ${vencen?.length > 0 ? `
  <table>
    <thead><tr><th>Socio</th><th>Vencimiento</th><th>Plan</th></tr></thead>
    <tbody>
      ${vencen.map(s => `<tr><td>${s.nombre || '-'}</td><td>${s.fecha_vencimiento || '-'}</td><td>${s.plan_nombre || '-'}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : '<p class="empty">No hay vencimientos esta semana</p>'}

  <h2>Ingresos</h2>
  ${ingresos ? `
  <p><strong>Total: $${ingresos.total?.toFixed(2) ?? '0.00'}</strong> | ${ingresos.resumen?.totalPagos ?? 0} pagos | Promedio: $${ingresos.resumen?.promedio?.toFixed(2) ?? '0.00'}</p>
  ${ingresos.porDia?.length > 0 ? `
  <table>
    <thead><tr><th>Fecha</th><th>Monto</th></tr></thead>
    <tbody>
      ${ingresos.porDia.map(d => `<tr><td>${d.fecha}</td><td>$${d.monto?.toFixed(2) ?? '0.00'}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}
  ` : '<p class="empty">Sin datos</p>'}

  <h2>Ocupación de Clases</h2>
  ${ocupacion ? `
  <p>Promedio: ${ocupacion.promedio ?? 0}% | Total clases: ${ocupacion.total ?? 0}</p>
  ${ocupacion.clases?.length > 0 ? `
  <table>
    <thead><tr><th>Clase</th><th>Fecha</th><th>Ocupación</th><th>%</th></tr></thead>
    <tbody>
      ${ocupacion.clases.map(c => `<tr><td>${c.nombre}</td><td>${c.fecha}</td><td>${c.ocupados}/${c.cupo}</td><td>${c.porcentaje}%</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}
  ` : '<p class="empty">Sin datos</p>'}

  <h2>Control de Accesos</h2>
  ${accesos ? `
  <p>Total: ${accesos.total ?? 0} | Permitidos: ${accesos.permitidos ?? 0} (${accesos.porcentajePermitidos ?? 0}%) | Denegados: ${accesos.denegados ?? 0}</p>
  ${accesos.porDia?.length > 0 ? `
  <table>
    <thead><tr><th>Fecha</th><th>Permitidos</th><th>Denegados</th></tr></thead>
    <tbody>
      ${accesos.porDia.map(d => `<tr><td>${d.fecha}</td><td>${d.permitidos}</td><td>${d.denegados}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}
  ` : '<p class="empty">Sin datos</p>'}

  <h2>Métodos de Pago</h2>
  ${metodosPago ? `
  <table>
    <tr><td><strong>Efectivo</strong></td><td>$${metodosPago.efectivo?.total?.toFixed(2) ?? '0.00'}</td><td>${metodosPago.efectivo?.cantidad ?? 0} pagos (${metodosPago.efectivo?.porcentaje ?? 0}%)</td></tr>
    <tr><td><strong>Transferencia</strong></td><td>$${metodosPago.transferencia?.total?.toFixed(2) ?? '0.00'}</td><td>${metodosPago.transferencia?.cantidad ?? 0} pagos (${metodosPago.transferencia?.porcentaje ?? 0}%)</td></tr>
  </table>
  ` : '<p class="empty">Sin datos</p>'}

  <h2>Socios Más Activos</h2>
  ${sociosActivos?.length > 0 ? `
  <table>
    <thead><tr><th>Socio</th><th>Reservas</th><th>Accesos</th><th>Pagos</th><th>Total Pagado</th></tr></thead>
    <tbody>
      ${sociosActivos.map(s => `<tr><td>${s.nombre}</td><td>${s.total_reservas ?? 0}</td><td>${s.total_accesos ?? 0}</td><td>${s.total_pagos ?? 0}</td><td>$${(s.total_pagado ?? 0).toFixed(2)}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : '<p class="empty">Sin datos</p>'}

  <h2>Clases Más Populares</h2>
  ${clasesPopulares?.length > 0 ? `
  <table>
    <thead><tr><th>Clase</th><th>Total Clases</th><th>Reservas</th><th>Ocupación</th><th>% Asistencia</th></tr></thead>
    <tbody>
      ${clasesPopulares.map(c => `<tr><td>${c.nombre}</td><td>${c.total_clases ?? 0}</td><td>${c.total_reservas ?? 0}</td><td>${c.total_ocupados ?? 0}/${c.total_cupos ?? 0}</td><td>${c.porcentaje_asistencia ? Math.round(c.porcentaje_asistencia) : 0}%</td></tr>`).join('')}
    </tbody>
  </table>
  ` : '<p class="empty">Sin datos</p>'}
</body>
</html>`;

    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.onload = () => ventana.print();
    }
  };

  const handleGuardarEImprimir = async () => {
    if (loading) return;
    try {
      await exportAllReportsToZip(filters);
      openPrintView();
    } catch (error) {
      console.error('Error al guardar o imprimir reportes:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">Filtros de fecha</h3>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={handleGuardarEImprimir}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Guardar e imprimir todos los reportes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <StatCards
            stats={{
              ...stats,
              totalIngresos: ingresos?.total || 0,
              promedioOcupacion: ocupacion?.promedio || 0,
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vencen esta semana */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-4">Vencen esta semana</h2>
              {vencen.length === 0 ? (
                <div className="text-gray-500 text-sm">No hay vencimientos esta semana</div>
              ) : (
                <div className="space-y-2">
                  {vencen.map((socio) => (
                    <div key={socio.id} className="border-b pb-2">
                      <div className="font-medium">{socio.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Vence: {socio.fecha_vencimiento} • Plan: {socio.plan_nombre}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingresos */}
            {ingresos && (
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold">Ingresos</h2>
                  <button
                    onClick={() => exportReportToCSV('ingresos', filters)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Exportar CSV
                  </button>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-green-600">
                    ${ingresos.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ingresos.resumen.totalPagos} pagos • Promedio: ${ingresos.resumen.promedio.toFixed(2)}
                  </div>
                </div>
                {ingresos.porDia.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <div className="text-sm font-semibold mb-2">Por día:</div>
                    {ingresos.porDia.map((dia, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b py-1">
                        <span>{dia.fecha}</span>
                        <span className="font-medium">${dia.monto.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ocupación de clases */}
          {ocupacion && (
            <div className="bg-white p-4 rounded-lg shadow mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Ocupación de Clases</h2>
                <button
                  onClick={() => exportReportToCSV('ocupacion', filters)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Exportar CSV
                </button>
              </div>
              <div className="mb-2">
                <div className="text-lg font-semibold">Promedio: {ocupacion.promedio}%</div>
                <div className="text-sm text-gray-600">Total de clases: {ocupacion.total}</div>
              </div>
              {ocupacion.clases.length > 0 && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Clase</th>
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Ocupación</th>
                        <th className="text-right py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocupacion.clases.map((clase) => (
                        <tr key={clase.id} className="border-b">
                          <td className="py-2">{clase.nombre}</td>
                          <td className="py-2">{clase.fecha}</td>
                          <td className="text-right py-2">
                            {clase.ocupados}/{clase.cupo}
                          </td>
                          <td className="text-right py-2">{clase.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Accesos */}
          {accesos && (
            <div className="bg-white p-4 rounded-lg shadow mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Control de Accesos</h2>
                <button
                  onClick={() => exportReportToCSV('accesos', filters)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Exportar CSV
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{accesos.total}</div>
                  <div className="text-sm text-gray-600">Total accesos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{accesos.permitidos}</div>
                  <div className="text-sm text-gray-600">Permitidos ({accesos.porcentajePermitidos}%)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{accesos.denegados}</div>
                  <div className="text-sm text-gray-600">Denegados</div>
                </div>
              </div>
              {accesos.porDia.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto">
                  <div className="text-sm font-semibold mb-2">Por día:</div>
                  {accesos.porDia.map((dia, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b py-1">
                      <span>{dia.fecha}</span>
                      <span className="flex gap-4">
                        <span className="text-green-600">{dia.permitidos} permitidos</span>
                        <span className="text-red-600">{dia.denegados} denegados</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Métodos de Pago */}
          {metodosPago && (
            <div className="bg-white p-4 rounded-lg shadow mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Métodos de Pago</h2>
                <button
                  onClick={() => exportReportToCSV('metodos_pago', filters)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Exportar CSV
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <div className="font-semibold text-green-600">Efectivo</div>
                  <div className="text-2xl font-bold">${metodosPago.efectivo.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {metodosPago.efectivo.cantidad} pagos ({metodosPago.efectivo.porcentaje}%)
                  </div>
                </div>
                <div className="border rounded p-3">
                  <div className="font-semibold text-blue-600">Transferencia</div>
                  <div className="text-2xl font-bold">${metodosPago.transferencia.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {metodosPago.transferencia.cantidad} pagos ({metodosPago.transferencia.porcentaje}%)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Socios Más Activos */}
          {sociosActivos.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Socios Más Activos</h2>
                <button
                  onClick={() => exportReportToCSV('socios_activos', {})}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Exportar CSV
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Socio</th>
                      <th className="text-right py-2">Reservas</th>
                      <th className="text-right py-2">Accesos</th>
                      <th className="text-right py-2">Pagos</th>
                      <th className="text-right py-2">Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sociosActivos.map((socio) => (
                      <tr key={socio.id} className="border-b">
                        <td className="py-2">{socio.nombre}</td>
                        <td className="text-right py-2">{socio.total_reservas || 0}</td>
                        <td className="text-right py-2">{socio.total_accesos || 0}</td>
                        <td className="text-right py-2">{socio.total_pagos || 0}</td>
                        <td className="text-right py-2">${(socio.total_pagado || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clases Más Populares */}
          {clasesPopulares.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Clases Más Populares</h2>
                <button
                  onClick={() => exportReportToCSV('clases_populares', {})}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Exportar CSV
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Clase</th>
                      <th className="text-right py-2">Total Clases</th>
                      <th className="text-right py-2">Reservas</th>
                      <th className="text-right py-2">Ocupación</th>
                      <th className="text-right py-2">% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasesPopulares.map((clase, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 font-medium">{clase.nombre}</td>
                        <td className="text-right py-2">{clase.total_clases || 0}</td>
                        <td className="text-right py-2">{clase.total_reservas || 0}</td>
                        <td className="text-right py-2">
                          {clase.total_ocupados || 0}/{clase.total_cupos || 0}
                        </td>
                        <td className="text-right py-2">
                          {clase.porcentaje_asistencia ? Math.round(clase.porcentaje_asistencia) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}



