import api from './api';
import JSZip from 'jszip';

export const getActivosInactivos = () => {
  return api.get('/api/reportes/activos_inactivos').then(r => r.data);
};

export const getVencenSemana = () => {
  return api.get('/api/reportes/vencen_semana').then(r => r.data);
};

export const getIngresos = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/ingresos?${queryParams}`).then(r => r.data);
};

export const getOcupacionClases = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/ocupacion_clases?${queryParams}`).then(r => r.data);
};

export const getAccesos = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/accesos?${queryParams}`).then(r => r.data);
};

export const getSociosActivos = () => {
  return api.get('/api/reportes/socios_activos').then(r => r.data);
};

export const getClasesPopulares = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/clases_populares?${queryParams}`).then(r => r.data);
};

export const getMetodosPago = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/metodos_pago?${queryParams}`).then(r => r.data);
};

export const getReportBlob = (tipo, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/export/${tipo}?${queryParams}`, {
    responseType: 'blob'
  }).then(response => new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
};

export const exportAllReportsToZip = async (filters = {}) => {
  const tiposConFiltros = ['ingresos', 'ocupacion', 'accesos', 'metodos_pago'];
  const tiposSinFiltros = ['socios_activos', 'clases_populares'];

  const zip = new JSZip();
  const fecha = new Date().toISOString().split('T')[0];

  const promesas = [
    ...tiposConFiltros.map(tipo => getReportBlob(tipo, filters).then(blob => ({ tipo, blob }))),
    ...tiposSinFiltros.map(tipo => getReportBlob(tipo, {}).then(blob => ({ tipo, blob })))
  ];

  const resultados = await Promise.allSettled(promesas);
  const todosLosTipos = [...tiposConFiltros, ...tiposSinFiltros];

  resultados.forEach((resultado, idx) => {
    const tipo = todosLosTipos[idx];
    const nombreArchivo = `${tipo}_${fecha}.csv`;
    if (resultado.status === 'fulfilled') {
      zip.file(nombreArchivo, resultado.value.blob);
    } else {
      zip.file(nombreArchivo, 'Error al exportar');
    }
  });

  const contenido = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(contenido);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reportes_${fecha}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportReportToCSV = (tipo, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/reportes/export/${tipo}?${queryParams}`, {
    responseType: 'blob'
  }).then(response => {
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
};

