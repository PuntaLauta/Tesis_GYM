import { useState, useEffect, useRef } from 'react';
import { 
  getActivosInactivos, 
  getIngresos, 
  getOcupacionClases,
  getAccesos,
  getEstadoSocios,
  getClasesPopulares,
  getMetodosPago,
  exportReportToCSV
} from '../services/reports';
import { listTiposClase } from '../services/tipoClase';
import { listSocios } from '../services/socios';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import StatCards from '../components/StatCards';
import ReportPdfModal from '../components/ReportPdfModal';
import { generateReportPdf } from '../utils/reportPdf';

const ESTADO_SOCIOS_PAGE_SIZE = 10;

function getMesActualRango() {
  const now = new Date();
  const primero = new Date(now.getFullYear(), now.getMonth(), 1);
  const ultimo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    desde: primero.toISOString().split('T')[0],
    hasta: ultimo.toISOString().split('T')[0],
  };
}

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [ingresos, setIngresos] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [accesos, setAccesos] = useState(null);
  const [estadoSocios, setEstadoSocios] = useState(null);
  const [clasesPopulares, setClasesPopulares] = useState([]);
  const [metodosPago, setMetodosPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingresosAgrupacion, setIngresosAgrupacion] = useState('semana');
  const [ingresosPagina, setIngresosPagina] = useState(1);
  const mesActual = getMesActualRango();
  const [ingresosFiltro, setIngresosFiltro] = useState(mesActual);
  const [ingresosFiltroAplicado, setIngresosFiltroAplicado] = useState(mesActual);
  const [ingresosVistaGrafica, setIngresosVistaGrafica] = useState(false);
  const [tiposClase, setTiposClase] = useState([]);
  const [ocupacionTipoClaseId, setOcupacionTipoClaseId] = useState('');
  const [ocupacionPagina, setOcupacionPagina] = useState(1);
  const [ocupacionFiltro, setOcupacionFiltro] = useState(mesActual);
  const [ocupacionFiltroAplicado, setOcupacionFiltroAplicado] = useState(mesActual);
  const [ocupacionVistaGrafica, setOcupacionVistaGrafica] = useState(false);
  const [clasesPopularesPagina, setClasesPopularesPagina] = useState(1);
  const [clasesPopularesFiltro, setClasesPopularesFiltro] = useState(mesActual);
  const [clasesPopularesFiltroAplicado, setClasesPopularesFiltroAplicado] = useState(mesActual);
  const [clasesPopularesVistaGrafica, setClasesPopularesVistaGrafica] = useState(false);
  const [accesosFiltro, setAccesosFiltro] = useState(mesActual);
  const [accesosFiltroAplicado, setAccesosFiltroAplicado] = useState(null);
  const [accesosAgrupacion, setAccesosAgrupacion] = useState('semana');
  const [accesosPagina, setAccesosPagina] = useState(1);
  const [accesosVistaGrafica, setAccesosVistaGrafica] = useState(false);
  const [estadoSociosFiltro, setEstadoSociosFiltro] = useState({ desde: '', hasta: '' });
  const [estadoSociosFiltroAplicado, setEstadoSociosFiltroAplicado] = useState(null);
  const [estadoSociosVistaGrafica, setEstadoSociosVistaGrafica] = useState(false);
  const [estadoSociosListaFiltroEstado, setEstadoSociosListaFiltroEstado] = useState(null);
  const [sociosParaEstadoReport, setSociosParaEstadoReport] = useState([]);
  const [estadoSociosPagina, setEstadoSociosPagina] = useState(1);
  const [filters, setFilters] = useState({
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Últimos 30 días
    hasta: new Date().toISOString().split('T')[0],
  });
  const [reportPdfModalOpen, setReportPdfModalOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filters]);

  useEffect(() => {
    setEstadoSociosPagina(1);
  }, [estadoSociosFiltroAplicado, estadoSociosListaFiltroEstado]);

  useEffect(() => {
    const loadSoloIngresos = async () => {
      try {
        const base = ingresosFiltroAplicado || filters;
        const ingresosData = await getIngresos({ ...base, agrupacion: ingresosAgrupacion });
        setIngresos(ingresosData.data);
        setIngresosPagina(1);
      } catch (error) {
        console.error('Error al recargar ingresos:', error);
      }
    };

    loadSoloIngresos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingresosAgrupacion]);

  useEffect(() => {
    const loadSoloOcupacion = async () => {
      try {
        const base = ocupacionFiltroAplicado || filters;
        const params = { ...base };
        if (ocupacionTipoClaseId) params.tipo_clase_id = ocupacionTipoClaseId;
        const ocupacionData = await getOcupacionClases(params);
        setOcupacion(ocupacionData.data);
      } catch (error) {
        console.error('Error al recargar ocupación:', error);
      }
    };

    loadSoloOcupacion();
    setOcupacionPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocupacionTipoClaseId]);

  useEffect(() => {
    const loadSoloClasesPopulares = async () => {
      try {
        const base = clasesPopularesFiltroAplicado || clasesPopularesFiltro || mesActual;
        const data = await getClasesPopulares(base);
        setClasesPopulares(data.data || []);
        setClasesPopularesPagina(1);
      } catch (error) {
        console.error('Error al recargar clases populares:', error);
      }
    };

    loadSoloClasesPopulares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clasesPopularesFiltroAplicado]);

  useEffect(() => {
    const loadSoloAccesos = async () => {
      try {
        const base = accesosFiltroAplicado || filters;
        const data = await getAccesos({ ...base, agrupacion: accesosAgrupacion });
        setAccesos(data.data);
        setAccesosPagina(1);
      } catch (error) {
        console.error('Error al recargar accesos:', error);
      }
    };

    if (accesos) loadSoloAccesos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accesosAgrupacion]);

  const aplicarFiltroEstadoSocios = async () => {
    setEstadoSociosFiltroAplicado(estadoSociosFiltro.desde || estadoSociosFiltro.hasta ? estadoSociosFiltro : null);
    const params = estadoSociosFiltro.desde || estadoSociosFiltro.hasta ? { ...estadoSociosFiltro } : {};
    try {
      const r = await getEstadoSocios(params);
      setEstadoSocios(r.data || null);
    } catch (e) {
      console.error('Error al filtrar estado socios:', e);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const paramsEstadoSocios = estadoSociosFiltroAplicado || {};
      const [
        activosData, 
        accesosData,
        estadoSociosData,
        sociosData
      ] = await Promise.all([
        getActivosInactivos(),
        getAccesos({ ...(accesosFiltroAplicado || filters), agrupacion: accesosAgrupacion }),
        getEstadoSocios(paramsEstadoSocios),
        listSocios(),
      ]);

      const [tiposData, ocupacionData, clasesPopularesData] = await Promise.all([
        listTiposClase(),
        getOcupacionClases({ ...(ocupacionFiltroAplicado || filters), ...(ocupacionTipoClaseId ? { tipo_clase_id: ocupacionTipoClaseId } : {}) }),
        getClasesPopulares(),
      ]);
      setTiposClase(tiposData.data || []);
      setOcupacion(ocupacionData.data);

      setStats(activosData.data);
      setAccesos(accesosData.data);
      setEstadoSocios(estadoSociosData.data || null);
      setSociosParaEstadoReport(sociosData?.data || []);
      setClasesPopulares(clasesPopularesData.data || []);

      // Cargar ingresos con el filtro aplicado (por defecto mes actual)
      const rangoIngresos = ingresosFiltroAplicado || mesActual;
      const ingresosInicial = await getIngresos({ ...rangoIngresos, agrupacion: ingresosAgrupacion });
      setIngresos(ingresosInicial.data);

      const metodosPagoInicial = await getMetodosPago(rangoIngresos);
      setMetodosPago(metodosPagoInicial.data);
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
  <p>Promedio de Ocupación: ${ocupacion.promedio ?? 0}% | Total clases: ${ocupacion.total ?? 0}</p>
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

  <h2>Estado de Socios</h2>
  ${estadoSocios ? `
  <p><strong>Total:</strong> ${estadoSocios.total ?? 0}</p>
  <table>
    <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
    <tbody>
      <tr><td>Activo</td><td>${estadoSocios.activo ?? 0}</td></tr>
      <tr><td>Inactivo</td><td>${estadoSocios.inactivo ?? 0}</td></tr>
      <tr><td>Suspendido</td><td>${estadoSocios.suspendido ?? 0}</td></tr>
      <tr><td>Abandono</td><td>${estadoSocios.abandono ?? 0}</td></tr>
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

  const handleGuardarEImprimir = () => {
    if (loading) return;
    setReportPdfModalOpen(true);
  };

  const defaultFiltersForModal = filters?.desde && filters?.hasta
    ? { desde: filters.desde, hasta: filters.hasta }
    : getMesActualRango();

  const handleGeneratePdf = async (config) => {
    try {
      await generateReportPdf(config, {
        getIngresos,
        getClasesPopulares,
        getOcupacionClases,
        getAccesos,
        getEstadoSocios,
        getMetodosPago,
        getMetodosPago,
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  const sentinelRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  useEffect(() => {
    if (loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const ENTER_HYSTERESIS_PX = 60;
    const LEAVE_HYSTERESIS_PX = 140;
    const enterSticky = new IntersectionObserver(
      ([e]) => { if (!e.isIntersecting && !isStickyRef.current) setIsSticky(true); },
      { threshold: 0, root: null, rootMargin: `-${ENTER_HYSTERESIS_PX}px 0px 0px 0px` }
    );
    const leaveSticky = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && isStickyRef.current) setIsSticky(false); },
      { threshold: 0, root: null, rootMargin: `${LEAVE_HYSTERESIS_PX}px 0px 0px 0px` }
    );
    enterSticky.observe(sentinel);
    leaveSticky.observe(sentinel);
    return () => {
      enterSticky.disconnect();
      leaveSticky.disconnect();
    };
  }, [loading]);

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reportes</h1>
      </div>

      {loading ? (
        <div className="max-w-6xl mx-auto p-6 text-center py-8">Cargando...</div>
      ) : (
        <>
          <div ref={sentinelRef} className="h-px w-full" aria-hidden />
          <div
            className={
              isSticky
                ? 'sticky top-0 z-10 w-full bg-white shadow-sm border-b border-gray-100 py-2 transition-[padding,box-shadow,background-color,border-color] duration-300 ease-out'
                : 'sticky top-0 z-10 py-4 transition-[padding,box-shadow,background-color,border-color] duration-300 ease-out'
            }
          >
            <div
              className={
                isSticky
                  ? 'max-w-6xl mx-auto px-6 transition-[padding,border-radius,box-shadow] duration-300 ease-out'
                  : 'max-w-6xl mx-auto px-6 rounded-xl shadow-md bg-white p-4 transition-[padding,border-radius,box-shadow] duration-300 ease-out'
              }
            >
              {isSticky ? (
                <div className="flex items-center justify-between gap-4">
                  <StatCards isSticky />
                  <button
                    onClick={handleGuardarEImprimir}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                  >
                    Generar e imprimir un reporte personalizado
                  </button>
                </div>
              ) : (
                <StatCards onPrint={handleGuardarEImprimir} />
              )}
            </div>
          </div>

          <div className="max-w-6xl mx-auto p-6 pt-4">

          {/* Ingresos - primer bloque debajo de las cards */}
          {ingresos && (
            <div id="reporte-ingresos" className="bg-white p-4 rounded-lg shadow mt-6">
              {(() => {
                const totalItems = ingresos.porDia?.length || 0;
                const totalAgrupacion = (ingresos.porDia || []).reduce((sum, item) => sum + (item.monto || 0), 0);
                const pageSize = 8;
                const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
                const paginaActual = Math.min(ingresosPagina, totalPages);
                const inicio = (paginaActual - 1) * pageSize;
                const fin = inicio + pageSize;
                const itemsPagina = ingresos.porDia?.slice(inicio, fin) || [];
                const blanks = pageSize - itemsPagina.length;

                const handlePaginaInputChange = (e) => {
                  const value = parseInt(e.target.value, 10);
                  if (Number.isNaN(value)) return;
                  const nuevaPagina = Math.min(Math.max(1, value), totalPages);
                  setIngresosPagina(nuevaPagina);
                };

                const handleFiltroChange = (campo, valor) => {
                  setIngresosFiltro(prev => ({ ...prev, [campo]: valor }));
                };

                const handleAplicarFiltroIngresos = async () => {
                  try {
                    const base = {
                      ...filters,
                      ...(ingresosFiltro.desde ? { desde: ingresosFiltro.desde } : {}),
                      ...(ingresosFiltro.hasta ? { hasta: ingresosFiltro.hasta } : {}),
                    };
                    const [ingresosData, metodosPagoData] = await Promise.all([
                      getIngresos({ ...base, agrupacion: ingresosAgrupacion }),
                      getMetodosPago(base),
                    ]);
                    setIngresos(ingresosData.data);
                    setMetodosPago(metodosPagoData.data);
                    setIngresosFiltroAplicado(base);
                    setIngresosPagina(1);
                  } catch (error) {
                    console.error('Error al filtrar ingresos:', error);
                  }
                };

                const dataGrafico = {
                  labels: ingresos.porDia.map(d => d.fecha),
                  datasets: [
                    {
                      label: 'Efectivo',
                      data: ingresos.porDia.map(d => d.efectivo || 0),
                      backgroundColor: 'rgba(34, 197, 94, 0.7)', // verde
                    },
                    {
                      label: 'Transferencia',
                      data: ingresos.porDia.map(d => d.transferencia || 0),
                      backgroundColor: 'rgba(37, 99, 235, 0.7)', // azul
                    },
                  ],
                };

                const opcionesGrafico = {
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const valor = context.parsed.y || 0;
                          return `${context.dataset.label}: $${valor.toFixed(2)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                      beginAtZero: true,
                    },
                  },
                };

                return ingresosVistaGrafica ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h1 className="font-bold text-xl">Ingresos</h1>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Filtro:</span>
                          <input
                            type="date"
                            value={ingresosFiltro.desde}
                            onChange={(e) => handleFiltroChange('desde', e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <span className="text-gray-500 text-xs">a</span>
                          <input
                            type="date"
                            value={ingresosFiltro.hasta}
                            onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <button
                            onClick={handleAplicarFiltroIngresos}
                            className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Filtrar
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Agrupar por:</span>
                          <select
                            value={ingresosAgrupacion}
                            onChange={(e) => setIngresosAgrupacion(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="dia">Día</option>
                            <option value="semana">Semana</option>
                            <option value="mes">Mes</option>
                            <option value="anio">Año</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIngresosVistaGrafica(false)}
                          className="mt-1 px-3 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Cambiar a Vista Analítica
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 flex items-baseline gap-1">
                      <h2 className="text-lg font-bold text-black">Monto Total: </h2>
                      <span className="text-lg font-bold text-green-600">${totalAgrupacion.toFixed(2)}</span>
                    </div>
                    {metodosPago && (
                      <div className="mb-4 text-xs text-gray-600">
                        Distribución por método de pago (Efectivo vs Transferencia) en el período seleccionado.
                      </div>
                    )}
                    <div className="mt-2">
                      <Bar data={dataGrafico} options={opcionesGrafico} />
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <span className="inline-flex items-center mr-4">
                        <span className="w-3 h-3 mr-1 inline-block rounded-sm bg-green-500" /> Efectivo
                      </span>
                      <span className="inline-flex items-center">
                        <span className="w-3 h-3 mr-1 inline-block rounded-sm bg-blue-500" /> Transferencia
                      </span>
                    </div>
                  </>
                ) : (
                  <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="font-bold text-xl">Ingresos</h1>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Filtro:</span>
                    <input
                      type="date"
                      value={ingresosFiltro.desde}
                      onChange={(e) => handleFiltroChange('desde', e.target.value)}
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <span className="text-gray-500 text-xs">a</span>
                    <input
                      type="date"
                      value={ingresosFiltro.hasta}
                      onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <button
                      onClick={handleAplicarFiltroIngresos}
                      className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Filtrar
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Agrupar por:</span>
                    <select
                      value={ingresosAgrupacion}
                      onChange={(e) => setIngresosAgrupacion(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="dia">Día</option>
                      <option value="semana">Semana</option>
                      <option value="mes">Mes</option>
                      <option value="anio">Año</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIngresosVistaGrafica(true)}
                    className="mt-1 px-3 py-1 rounded text-xs text-white bg-green-600 hover:bg-green-700"
                  >
                    Cambiar a Vista Gráfica
                  </button>
                </div>
              </div>
              <div className="mb-2 flex items-baseline gap-1">
                <h2 className="text-lg font-bold text-black">Monto Total: </h2>
                <span className="text-lg font-bold text-green-600">${totalAgrupacion.toFixed(2)}</span>
              </div>
              {metodosPago && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="border rounded p-3">
                    <div className="font-semibold text-green-600">Efectivo</div>
                    <div className="text-lg font-bold">
                      ${metodosPago.efectivo.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {metodosPago.efectivo.cantidad} pagos ({metodosPago.efectivo.porcentaje}%)
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="font-semibold text-blue-600">Transferencia</div>
                    <div className="text-lg font-bold">
                      ${metodosPago.transferencia.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {metodosPago.transferencia.cantidad} pagos ({metodosPago.transferencia.porcentaje}%)
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2 flex justify-between">
                  <span>
                    {ingresosAgrupacion === 'dia' && 'Por día:'}
                    {ingresosAgrupacion === 'semana' && 'Por semana:'}
                    {ingresosAgrupacion === 'mes' && 'Por mes:'}
                    {ingresosAgrupacion === 'anio' && 'Por año:'}
                  </span>
                  <span>Monto</span>
                </div>
                {itemsPagina.map((dia, idx) => (
                  <div key={idx} className="flex justify-between text-sm border-b py-1">
                    <span>{dia.fecha}</span>
                    <span className="font-medium">${dia.monto.toFixed(2)}</span>
                  </div>
                ))}
                {blanks > 0 &&
                  Array.from({ length: blanks }).map((_, idx) => (
                    <div
                      key={`blank-${idx}`}
                      className="flex justify-between text-sm border-b py-1 text-transparent"
                    >
                      <span>-</span>
                      <span>-</span>
                    </div>
                  ))}
              </div>
              {totalItems > 0 && (
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Mostrando {inicio + 1}-{Math.min(fin, totalItems)} de {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIngresosPagina(prev => Math.max(1, prev - 1))}
                      disabled={paginaActual === 1}
                      className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="flex items-center gap-1">
                      <span>Página</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={paginaActual}
                        onChange={handlePaginaInputChange}
                        className="w-12 border rounded px-1 py-0.5 text-center"
                      />
                      <span>de {totalPages}</span>
                    </span>
                    <button
                      onClick={() => setIngresosPagina(prev => Math.min(totalPages, prev + 1))}
                      disabled={paginaActual === totalPages}
                      className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Clases Más Populares (debajo de Ingresos) */}
          {clasesPopulares && (
          <div id="reporte-clases-populares">
          {(() => {
            const totalItems = clasesPopulares.length || 0;
            const pageSize = 8;
            const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
            const paginaActual = Math.min(clasesPopularesPagina, totalPages);
            const inicio = (paginaActual - 1) * pageSize;
            const fin = inicio + pageSize;
            const itemsPagina = clasesPopulares.slice(inicio, fin);
            const blanks = pageSize - itemsPagina.length;

            const handlePaginaClasesChange = (e) => {
              const value = parseInt(e.target.value, 10);
              if (Number.isNaN(value)) return;
              const nuevaPagina = Math.min(Math.max(1, value), totalPages);
              setClasesPopularesPagina(nuevaPagina);
            };

            const handleFiltrarClasesPopulares = async () => {
              try {
                const params = { ...clasesPopularesFiltro };
                const data = await getClasesPopulares(params);
                setClasesPopulares(data.data || []);
                setClasesPopularesFiltroAplicado(clasesPopularesFiltro);
                setClasesPopularesPagina(1);
              } catch (error) {
                console.error('Error al filtrar clases populares:', error);
              }
            };

            const coloresTorta = [
              'rgba(34, 197, 94, 0.8)', 'rgba(37, 99, 235, 0.8)', 'rgba(234, 179, 8, 0.8)',
              'rgba(239, 68, 68, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(236, 72, 153, 0.8)',
              'rgba(20, 184, 166, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(99, 102, 241, 0.8)',
              'rgba(34, 211, 238, 0.8)',
            ];
            const dataTorta = {
              labels: clasesPopulares.map(c => c.nombre || 'Sin nombre'),
              datasets: [{
                data: clasesPopulares.map(c => c.total_reservas || 0),
                backgroundColor: clasesPopulares.map((_, i) => coloresTorta[i % coloresTorta.length]),
                borderWidth: 1,
              }],
            };
            const totalReservasTorta = clasesPopulares.reduce((s, c) => s + (c.total_reservas || 0), 0);
            const opcionesTorta = {
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                      const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                      return `${ctx.label}: ${ctx.raw} reservas (${pct}%)`;
                    },
                  },
                },
              },
            };

            return (
              <div className="bg-white p-4 rounded-lg shadow mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="font-bold text-xl">Clases Más Populares</h1>
                  <div className="flex flex-col items-end gap-2 ml-auto">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Filtro:</span>
                      <input
                        type="date"
                        value={clasesPopularesFiltro.desde}
                        onChange={(e) => setClasesPopularesFiltro(f => ({ ...f, desde: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <span className="text-gray-500 text-xs">a</span>
                      <input
                        type="date"
                        value={clasesPopularesFiltro.hasta}
                        onChange={(e) => setClasesPopularesFiltro(f => ({ ...f, hasta: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleFiltrarClasesPopulares}
                        className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Filtrar
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClasesPopularesVistaGrafica(!clasesPopularesVistaGrafica)}
                      className={`mt-1 px-3 py-1 rounded text-xs text-white ${clasesPopularesVistaGrafica ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {clasesPopularesVistaGrafica ? 'Cambiar a Vista Analítica' : 'Cambiar a Vista Gráfica'}
                    </button>
                  </div>
                </div>
                {clasesPopularesVistaGrafica ? (
                  <>
                  <div className="mt-4 flex gap-6 w-full items-start">
                    <div className="flex-shrink-0 flex flex-col gap-1.5 text-sm">
                      {clasesPopulares.map((c, i) => {
                        const reservas = c.total_reservas || 0;
                        const pct = totalReservasTorta ? ((reservas / totalReservasTorta) * 100).toFixed(1) : '0';
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: coloresTorta[i % coloresTorta.length] }}
                            />
                            <span className="text-gray-700">{c.nombre || 'Sin nombre'}</span>
                            <span className="text-gray-600 font-medium">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-center items-center">
                      <div className="max-w-md max-h-80 w-full">
                        <Pie data={dataTorta} options={opcionesTorta} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Distribución de reservas por tipo de clase en el período seleccionado.</p>
                  </>
                ) : (
                <>
                <div className="mt-4">
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
                      {itemsPagina.map((clase, idx) => (
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
                      {blanks > 0 &&
                        Array.from({ length: blanks }).map((_, idx) => (
                          <tr key={`blank-clase-${idx}`} className="border-b">
                            <td className="py-2 text-transparent">-</td>
                            <td className="text-right py-2 text-transparent">-</td>
                            <td className="text-right py-2 text-transparent">-</td>
                            <td className="text-right py-2 text-transparent">-</td>
                            <td className="text-right py-2 text-transparent">-</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Mostrando {totalItems === 0 ? 0 : inicio + 1}-{Math.min(fin, totalItems)} de {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setClasesPopularesPagina(p => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="flex items-center gap-1">
                      <span>Página</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={paginaActual}
                        onChange={handlePaginaClasesChange}
                        className="w-12 border rounded px-1 py-0.5 text-center"
                      />
                      <span>de {totalPages}</span>
                    </span>
                    <button
                      onClick={() => setClasesPopularesPagina(p => Math.min(totalPages, p + 1))}
                      disabled={paginaActual === totalPages}
                      className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
                </>
                )}
              </div>
            );
          })()}
          </div>
          )}

          {/* Ocupación de clases */}
          {ocupacion && (
          <div id="reporte-ocupacion">
          {(() => {
            const totalItems = ocupacion.clases?.length || 0;
            const pageSize = 8;
            const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
            const paginaActual = Math.min(ocupacionPagina, totalPages);
            const inicio = (paginaActual - 1) * pageSize;
            const fin = inicio + pageSize;
            const itemsPagina = ocupacion.clases?.slice(inicio, fin) || [];
            const blanks = pageSize - itemsPagina.length;

            const handleOcupacionPaginaChange = (e) => {
              const value = parseInt(e.target.value, 10);
              if (Number.isNaN(value)) return;
              const nuevaPagina = Math.min(Math.max(1, value), totalPages);
              setOcupacionPagina(nuevaPagina);
            };

            const handleAplicarFiltroOcupacion = async () => {
              try {
                const params = { ...ocupacionFiltro };
                if (ocupacionTipoClaseId) params.tipo_clase_id = ocupacionTipoClaseId;
                const data = await getOcupacionClases(params);
                setOcupacion(data.data);
                setOcupacionFiltroAplicado(ocupacionFiltro);
                setOcupacionPagina(1);
              } catch (err) {
                console.error('Error al filtrar ocupación:', err);
              }
            };

            // Agregar por disciplina (nombre), ordenar por % descendente para el gráfico
            const porDisciplina = (ocupacion.clases || []).reduce((acc, c) => {
              const n = c.nombre ?? 'Sin nombre';
              if (!acc[n]) acc[n] = { nombre: n, cupo: 0, ocupados: 0 };
              acc[n].cupo += c.cupo ?? 0;
              acc[n].ocupados += c.ocupados ?? 0;
              return acc;
            }, {});
            const barrasOrdenadas = Object.values(porDisciplina)
              .map((d) => ({
                ...d,
                porcentaje: d.cupo > 0 ? Math.round((d.ocupados / d.cupo) * 100) : 0,
                disponibles: d.cupo - d.ocupados,
              }))
              .sort((a, b) => b.porcentaje - a.porcentaje);
            const dataBarrasOcupacion = {
              labels: barrasOrdenadas.map((d) => d.nombre),
              datasets: [
                {
                  label: 'Ocupados',
                  data: barrasOrdenadas.map((d) => d.ocupados),
                  backgroundColor: 'rgba(37, 99, 235, 0.8)',
                  borderWidth: 1,
                },
                {
                  label: 'Disponibles (límite restante)',
                  data: barrasOrdenadas.map((d) => d.disponibles),
                  backgroundColor: 'rgba(209, 213, 219, 0.8)',
                  borderWidth: 1,
                },
              ],
            };
            const opcionesBarrasOcupacion = {
              indexAxis: 'y',
              responsive: true,
              scales: {
                x: { stacked: true, beginAtZero: true, title: { display: true, text: 'Cupos' } },
                y: { stacked: true },
              },
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    afterLabel: (ctx) => {
                      const d = barrasOrdenadas[ctx.dataIndex];
                      return d ? `Ocupación: ${d.ocupados}/${d.cupo} (${d.porcentaje}%)` : '';
                    },
                  },
                },
              },
            };

            return (
              <div className="bg-white p-4 rounded-lg shadow mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="font-bold text-xl">Ocupación de Clases</h1>
                  <div className="flex flex-col items-end gap-2 ml-auto">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Filtro:</span>
                      <input
                        type="date"
                        value={ocupacionFiltro.desde}
                        onChange={(e) => setOcupacionFiltro((f) => ({ ...f, desde: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <span className="text-gray-500 text-xs">a</span>
                      <input
                        type="date"
                        value={ocupacionFiltro.hasta}
                        onChange={(e) => setOcupacionFiltro((f) => ({ ...f, hasta: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAplicarFiltroOcupacion}
                        className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Filtrar
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Filtro tipo de clase:</span>
                      <select
                        value={ocupacionTipoClaseId}
                        onChange={(e) => setOcupacionTipoClaseId(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="">Todos</option>
                        {tiposClase.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOcupacionVistaGrafica(!ocupacionVistaGrafica)}
                      className={`mt-1 px-3 py-1 rounded text-xs text-white ${ocupacionVistaGrafica ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {ocupacionVistaGrafica ? 'Cambiar a Vista Analítica' : 'Cambiar a Vista Gráfica'}
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <h2 className="text-lg font-semibold">Promedio de Ocupación: {ocupacion.promedio}%</h2>
                  <div className="text-sm text-gray-600">Total de clases: {ocupacion.total}</div>
                </div>
                {ocupacionVistaGrafica ? (
                  <div className="mt-4 w-full">
                    <div className="w-full">
                      <Bar data={dataBarrasOcupacion} options={opcionesBarrasOcupacion} />
                    </div>
                    <p className="mt-2 text-xs text-gray-600">Límite (gris) vs. ocupación real (azul). Ordenado de mayor a menor % de ocupación.</p>
                  </div>
                ) : (
                <>
                <div className="mt-4">
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
                      {itemsPagina.map((clase) => (
                        <tr key={clase.id} className="border-b">
                          <td className="py-2">{clase.nombre ?? '-'}</td>
                          <td className="py-2">{clase.fecha ?? '-'}</td>
                          <td className="text-right py-2">
                            {clase.ocupados}/{clase.cupo}
                          </td>
                          <td className="text-right py-2">{clase.porcentaje}%</td>
                        </tr>
                      ))}
                      {blanks > 0 &&
                        Array.from({ length: blanks }).map((_, idx) => (
                          <tr key={`blank-${idx}`} className="border-b">
                            <td className="py-2 text-transparent">-</td>
                            <td className="py-2 text-transparent">-</td>
                            <td className="text-right py-2 text-transparent">-</td>
                            <td className="text-right py-2 text-transparent">-</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Mostrando {totalItems === 0 ? 0 : inicio + 1}-{Math.min(fin, totalItems)} de {totalItems}
                  </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOcupacionPagina((p) => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                        className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="flex items-center gap-1">
                        <span>Página</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={paginaActual}
                          onChange={handleOcupacionPaginaChange}
                          className="w-12 border rounded px-1 py-0.5 text-center"
                        />
                        <span>de {totalPages}</span>
                      </span>
                      <button
                        onClick={() => setOcupacionPagina((p) => Math.min(totalPages, p + 1))}
                        disabled={paginaActual === totalPages}
                        className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                </div>
                </>
                )}
              </div>
            );
          })()}
          </div>
          )}

          {/* Accesos */}
          {accesos && (
          <div id="reporte-accesos">
          {(() => {
            const items = accesos.porDia || [];
            const totalItems = items.length;
            const pageSize = 8;
            const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
            const paginaActual = Math.min(accesosPagina, totalPages);
            const inicio = (paginaActual - 1) * pageSize;
            const fin = inicio + pageSize;
            const itemsPagina = items.slice(inicio, fin);
            const blanks = pageSize - itemsPagina.length;

            const handleAccesosPaginaChange = (e) => {
              const value = parseInt(e.target.value, 10);
              if (Number.isNaN(value)) return;
              setAccesosPagina(Math.min(Math.max(1, value), totalPages));
            };

            const handleFiltrarAccesos = async () => {
              try {
                const data = await getAccesos({ ...accesosFiltro, agrupacion: accesosAgrupacion });
                setAccesos(data.data);
                setAccesosFiltroAplicado(accesosFiltro);
                setAccesosPagina(1);
              } catch (err) {
                console.error('Error al filtrar accesos:', err);
              }
            };

            const dataBarrasAccesos = {
              labels: items.map((d) => d.fecha),
              datasets: [
                { label: 'Permitidos', data: items.map((d) => d.permitidos || 0), backgroundColor: 'rgba(34, 197, 94, 0.8)', borderWidth: 1 },
                { label: 'Denegados', data: items.map((d) => d.denegados || 0), backgroundColor: 'rgba(239, 68, 68, 0.8)', borderWidth: 1 },
              ],
            };
            const opcionesBarrasAccesos = {
              responsive: true,
              scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true, beginAtZero: true } },
              plugins: { legend: { position: 'bottom' } },
            };

            return (
              <div className="bg-white p-4 rounded-lg shadow mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="font-bold text-xl">Control de Accesos</h1>
                  <div className="flex flex-col items-end gap-2 ml-auto">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Filtro:</span>
                      <input
                        type="date"
                        value={accesosFiltro.desde}
                        onChange={(e) => setAccesosFiltro((f) => ({ ...f, desde: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <span className="text-gray-500 text-xs">a</span>
                      <input
                        type="date"
                        value={accesosFiltro.hasta}
                        onChange={(e) => setAccesosFiltro((f) => ({ ...f, hasta: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <button type="button" onClick={handleFiltrarAccesos} className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                        Filtrar
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Agrupar por:</span>
                      <select
                        value={accesosAgrupacion}
                        onChange={(e) => setAccesosAgrupacion(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="dia">Día</option>
                        <option value="semana">Semana</option>
                        <option value="mes">Mes</option>
                        <option value="anio">Año</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccesosVistaGrafica(!accesosVistaGrafica)}
                      className={`mt-1 px-3 py-1 rounded text-xs text-white ${accesosVistaGrafica ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {accesosVistaGrafica ? 'Cambiar a Vista Analítica' : 'Cambiar a Vista Gráfica'}
                    </button>
                  </div>
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
                {accesosVistaGrafica ? (
                  <div className="mt-4 w-full">
                    <Bar data={dataBarrasAccesos} options={opcionesBarrasAccesos} />
                    <p className="mt-2 text-xs text-gray-600">Permitidos (verde) y denegados (rojo) por período.</p>
                  </div>
                ) : (
                  <>
                    <div className="mt-4">
                      <div className="text-sm font-semibold mb-2 flex justify-between">
                        <span>Período</span>
                        <span className="flex gap-4">
                          <span className="text-green-600">Permitidos</span>
                          <span className="text-red-600">Denegados</span>
                        </span>
                      </div>
                      {itemsPagina.map((dia, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b py-1">
                          <span>{dia.fecha}</span>
                          <span className="flex gap-4">
                            <span className="text-green-600">{dia.permitidos ?? 0}</span>
                            <span className="text-red-600">{dia.denegados ?? 0}</span>
                          </span>
                        </div>
                      ))}
                      {blanks > 0 &&
                        Array.from({ length: blanks }).map((_, idx) => (
                          <div key={`blank-acc-${idx}`} className="flex justify-between text-sm border-b py-1 text-transparent">
                            <span>-</span>
                            <span className="flex gap-4"><span>-</span><span>-</span></span>
                          </div>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Mostrando {totalItems === 0 ? 0 : inicio + 1}-{Math.min(fin, totalItems)} de {totalItems}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAccesosPagina((p) => Math.max(1, p - 1))}
                          disabled={paginaActual === 1}
                          className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <span className="flex items-center gap-1">
                          <span>Página</span>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={paginaActual}
                            onChange={handleAccesosPaginaChange}
                            className="w-12 border rounded px-1 py-0.5 text-center"
                          />
                          <span>de {totalPages}</span>
                        </span>
                        <button
                          onClick={() => setAccesosPagina((p) => Math.min(totalPages, p + 1))}
                          disabled={paginaActual === totalPages}
                          className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
          </div>
          )}

          {/* Estado de Socios */}
          {estadoSocios && (
            <div id="reporte-estado-socios" className="bg-white p-4 rounded-lg shadow mt-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="font-bold text-xl">Estado de Socios</h1>
                <div className="flex flex-col items-end gap-2 ml-auto">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Filtro:</span>
                    <input
                      type="date"
                      value={estadoSociosFiltro.desde}
                      onChange={(e) => setEstadoSociosFiltro((f) => ({ ...f, desde: e.target.value }))}
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <span className="text-gray-500 text-xs">a</span>
                    <input
                      type="date"
                      value={estadoSociosFiltro.hasta}
                      onChange={(e) => setEstadoSociosFiltro((f) => ({ ...f, hasta: e.target.value }))}
                      className="border rounded px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={aplicarFiltroEstadoSocios}
                      className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Filtrar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEstadoSociosVistaGrafica((v) => !v)}
                    className={`mt-1 px-3 py-1 rounded text-xs text-white ${estadoSociosVistaGrafica ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {estadoSociosVistaGrafica ? 'Cambiar a Vista Analítica' : 'Cambiar a Vista Gráfica'}
                  </button>
                </div>
              </div>
              {!estadoSociosVistaGrafica ? (
                <>
                  <h2 className="text-lg font-semibold mb-4">Total: {estadoSocios.total ?? 0}</h2>
                  {estadoSociosListaFiltroEstado && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => { setEstadoSociosListaFiltroEstado(null); setEstadoSociosPagina(1); }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Ver todos los socios
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      type="button"
                      onClick={() => { setEstadoSociosListaFiltroEstado('activo'); setEstadoSociosPagina(1); }}
                      className={`rounded-lg p-4 border text-left transition-all cursor-pointer hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-600 ${estadoSociosListaFiltroEstado === 'activo' ? 'ring-2 ring-green-600 border-green-600 shadow-md' : 'border-[#99e699]'} bg-[#e6ffe6]`}
                    >
                      <div className="font-semibold text-gray-700">Socios Activos</div>
                      <div className="text-xl font-bold text-green-700">{estadoSocios.activo ?? 0}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEstadoSociosListaFiltroEstado('inactivo'); setEstadoSociosPagina(1); }}
                      className={`rounded-lg p-4 border text-left transition-all cursor-pointer hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600 ${estadoSociosListaFiltroEstado === 'inactivo' ? 'ring-2 ring-red-600 border-red-600 shadow-md' : 'border-[#ffb3b3]'} bg-[#ffe6e6]`}
                    >
                      <div className="font-semibold text-gray-700">Socios Inactivos</div>
                      <div className="text-xl font-bold text-red-700">{estadoSocios.inactivo ?? 0}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEstadoSociosListaFiltroEstado('suspendido'); setEstadoSociosPagina(1); }}
                      className={`rounded-lg p-4 border text-left transition-all cursor-pointer hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-600 ${estadoSociosListaFiltroEstado === 'suspendido' ? 'ring-2 ring-yellow-600 border-yellow-600 shadow-md' : 'border-[#eab308]'} bg-[#fef9c3]`}
                    >
                      <div className="font-semibold text-gray-700">Suspendidos</div>
                      <div className="text-xl font-bold text-yellow-800">{estadoSocios.suspendido ?? 0}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEstadoSociosListaFiltroEstado('abandono'); setEstadoSociosPagina(1); }}
                      className={`rounded-lg p-4 border text-left transition-all cursor-pointer hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-600 ${estadoSociosListaFiltroEstado === 'abandono' ? 'ring-2 ring-orange-600 border-orange-600 shadow-md' : 'border-[#ea580c]'} bg-[#fff0e6]`}
                    >
                      <div className="font-semibold text-gray-700">Abandono</div>
                      <div className="text-xl font-bold text-orange-700">{estadoSocios.abandono ?? 0}</div>
                    </button>
                  </div>
                  {(() => {
                    const aplicado = estadoSociosFiltroAplicado || {};
                    const estadoLista = estadoSociosListaFiltroEstado;
                    const listaFiltrada = (sociosParaEstadoReport || []).filter((s) => {
                      if (aplicado.desde || aplicado.hasta) {
                        const fc = s.fecha_cambio ? String(s.fecha_cambio).split('T')[0] : null;
                        if (!fc) return false;
                        if (aplicado.desde && fc < aplicado.desde) return false;
                        if (aplicado.hasta && fc > aplicado.hasta) return false;
                      }
                      if (estadoLista && (s.estado || '').toLowerCase() !== estadoLista.toLowerCase()) return false;
                      return true;
                    });
                    const total = listaFiltrada.length;
                    const totalPages = Math.max(1, Math.ceil(total / ESTADO_SOCIOS_PAGE_SIZE));
                    const pagina = Math.min(Math.max(1, estadoSociosPagina), totalPages);
                    const start = (pagina - 1) * ESTADO_SOCIOS_PAGE_SIZE;
                    const pageItems = listaFiltrada.slice(start, start + ESTADO_SOCIOS_PAGE_SIZE);
                    const from = total === 0 ? 0 : start + 1;
                    const to = total === 0 ? 0 : Math.min(start + ESTADO_SOCIOS_PAGE_SIZE, total);
                    return (
                      <div className="mt-4">
                        <div className="text-sm font-semibold mb-2">Socios ({total})</div>
                        <div className="overflow-x-auto border rounded">
                          <table className="w-full text-sm table-fixed">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2">Nombre</th>
                                <th className="text-left p-2">Estado</th>
                                <th className="text-left p-2">Fecha cambio</th>
                                <th className="text-left p-2">Documento</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: ESTADO_SOCIOS_PAGE_SIZE }, (_, i) => {
                                const s = pageItems[i];
                                if (!s) {
                                  return <tr key={`empty-${i}`} className="border-t h-10 min-h-[40px]"><td colSpan={4} className="p-2 h-10 min-h-[40px]">&nbsp;</td></tr>;
                                }
                                return (
                                  <tr key={s.id} className="border-t h-10">
                                    <td className="p-2 truncate">{s.nombre}</td>
                                    <td className="p-2">{s.estado ?? '-'}</td>
                                    <td className="p-2">{s.fecha_cambio ? String(s.fecha_cambio).split('T')[0] : '-'}</td>
                                    <td className="p-2">{s.documento ?? '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                          <span>Mostrando {from}-{to} de {total}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEstadoSociosPagina((p) => Math.max(1, p - 1))}
                              disabled={pagina <= 1}
                              className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Anterior
                            </button>
                            <span className="flex items-center gap-1">
                              <span>Página</span>
                              <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={pagina}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v)) setEstadoSociosPagina(Math.min(totalPages, Math.max(1, v)));
                                }}
                                className="w-12 border rounded px-1 py-0.5 text-center"
                              />
                              <span>de {totalPages}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEstadoSociosPagina((p) => Math.min(totalPages, p + 1))}
                              disabled={pagina >= totalPages}
                              className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-6 w-full items-start">
                    <div className="flex-shrink-0 flex flex-col gap-1.5 text-sm">
                      {(() => {
                        const total = estadoSocios.total || 0;
                        const colores = { activo: '#22c55e', inactivo: '#dc2626', suspendido: '#eab308', abandono: '#ea580c' };
                        const etiquetas = [
                          { key: 'activo', label: 'Activo', value: estadoSocios.activo ?? 0 },
                          { key: 'inactivo', label: 'Inactivo', value: estadoSocios.inactivo ?? 0 },
                          { key: 'suspendido', label: 'Suspendido', value: estadoSocios.suspendido ?? 0 },
                          { key: 'abandono', label: 'Abandono', value: estadoSocios.abandono ?? 0 },
                        ];
                        return etiquetas.map(({ key, label, value }) => {
                          const pct = total ? ((value / total) * 100).toFixed(1) : '0';
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: colores[key] }}
                              />
                              <span className="text-gray-700">{label}</span>
                              <span className="text-gray-600 font-medium">{pct}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-center items-center">
                      <div className="h-80 max-w-md w-full">
                        <Pie
                          data={{
                            labels: ['Activo', 'Inactivo', 'Suspendido', 'Abandono'],
                            datasets: [{
                              data: [
                                estadoSocios.activo ?? 0,
                                estadoSocios.inactivo ?? 0,
                                estadoSocios.suspendido ?? 0,
                                estadoSocios.abandono ?? 0,
                              ],
                              backgroundColor: ['#22c55e', '#dc2626', '#eab308', '#ea580c'],
                              borderColor: '#fff',
                              borderWidth: 1,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-gray-700">Leyenda (clic para filtrar lista):</span>
                    {['activo', 'inactivo', 'suspendido', 'abandono'].map((estado) => {
                      const colores = { activo: '#22c55e', inactivo: '#dc2626', suspendido: '#eab308', abandono: '#ea580c' };
                      const etiquetas = { activo: 'Activo', inactivo: 'Inactivo', suspendido: 'Suspendido', abandono: 'Abandono' };
                      const activo = estadoSociosListaFiltroEstado === estado;
                      const textoClaro = estado === 'suspendido'; // amarillo: texto oscuro para contraste
                      return (
                        <button
                          key={estado}
                          type="button"
                          onClick={() => setEstadoSociosListaFiltroEstado(activo ? null : estado)}
                          className={`px-3 py-1 rounded text-sm font-medium border-2 border-transparent hover:opacity-90 ${textoClaro ? 'text-gray-900' : 'text-white'}`}
                          style={{ backgroundColor: colores[estado], borderColor: activo ? '#333' : 'transparent' }}
                        >
                          {etiquetas[estado]}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setEstadoSociosListaFiltroEstado(null)}
                      className="px-2 py-1 text-sm text-gray-600 underline"
                    >
                      Ver todos
                    </button>
                  </div>
                  {(() => {
                    const aplicado = estadoSociosFiltroAplicado || {};
                    const listaFiltrada = (sociosParaEstadoReport || []).filter((s) => {
                      if (aplicado.desde || aplicado.hasta) {
                        const fc = s.fecha_cambio ? String(s.fecha_cambio).split('T')[0] : null;
                        if (!fc) return false;
                        if (aplicado.desde && fc < aplicado.desde) return false;
                        if (aplicado.hasta && fc > aplicado.hasta) return false;
                      }
                      if (estadoSociosListaFiltroEstado) {
                        return (s.estado || '').toLowerCase() === estadoSociosListaFiltroEstado.toLowerCase();
                      }
                      return true;
                    });
                    const total = listaFiltrada.length;
                    const totalPages = Math.max(1, Math.ceil(total / ESTADO_SOCIOS_PAGE_SIZE));
                    const pagina = Math.min(Math.max(1, estadoSociosPagina), totalPages);
                    const start = (pagina - 1) * ESTADO_SOCIOS_PAGE_SIZE;
                    const pageItems = listaFiltrada.slice(start, start + ESTADO_SOCIOS_PAGE_SIZE);
                    const from = total === 0 ? 0 : start + 1;
                    const to = total === 0 ? 0 : Math.min(start + ESTADO_SOCIOS_PAGE_SIZE, total);
                    return (
                      <div className="mt-2">
                        <div className="text-sm font-semibold mb-2">
                          {estadoSociosListaFiltroEstado ? `Socios en ${estadoSociosListaFiltroEstado} (${total})` : `Socios (${total})`}
                        </div>
                        <div className="overflow-x-auto border rounded">
                          <table className="w-full text-sm table-fixed">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2">Nombre</th>
                                <th className="text-left p-2">Estado</th>
                                <th className="text-left p-2">Fecha cambio</th>
                                <th className="text-left p-2">Documento</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: ESTADO_SOCIOS_PAGE_SIZE }, (_, i) => {
                                const s = pageItems[i];
                                if (!s) {
                                  return <tr key={`empty-g-${i}`} className="border-t h-10 min-h-[40px]"><td colSpan={4} className="p-2 h-10 min-h-[40px]">&nbsp;</td></tr>;
                                }
                                return (
                                  <tr key={s.id} className="border-t h-10">
                                    <td className="p-2 truncate">{s.nombre}</td>
                                    <td className="p-2">{s.estado ?? '-'}</td>
                                    <td className="p-2">{s.fecha_cambio ? String(s.fecha_cambio).split('T')[0] : '-'}</td>
                                    <td className="p-2">{s.documento ?? '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                          <span>Mostrando {from}-{to} de {total}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEstadoSociosPagina((p) => Math.max(1, p - 1))}
                              disabled={pagina <= 1}
                              className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Anterior
                            </button>
                            <span className="flex items-center gap-1">
                              <span>Página</span>
                              <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={pagina}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v)) setEstadoSociosPagina(Math.min(totalPages, Math.max(1, v)));
                                }}
                                className="w-12 border rounded px-1 py-0.5 text-center"
                              />
                              <span>de {totalPages}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEstadoSociosPagina((p) => Math.min(totalPages, p + 1))}
                              disabled={pagina >= totalPages}
                              className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          </div>

        </>
      )}
      <ReportPdfModal
        open={reportPdfModalOpen}
        onClose={() => setReportPdfModalOpen(false)}
        onGenerate={handleGeneratePdf}
        defaultFilters={defaultFiltersForModal}
        tiposClase={tiposClase}
      />
    </div>
  );
}



