import api from './api';

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

