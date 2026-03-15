import api from './api';

export const getConfiguracion = () => {
  return api.get('/api/configuracion').then(r => r.data);
};

export const updateConfiguracion = (config) => {
  return api.put('/api/configuracion', config).then(r => r.data);
};

export const actualizarEstadoSocios = () => {
  return api.post('/api/configuracion/actualizar-estado-socios').then(r => r.data);
};

export const getEstadoSociosCronConfig = () => {
  return api.get('/api/configuracion/estado-socios-cron').then(r => r.data);
};

export const updateEstadoSociosCronConfig = (config) => {
  return api.put('/api/configuracion/estado-socios-cron', config).then(r => r.data);
};



