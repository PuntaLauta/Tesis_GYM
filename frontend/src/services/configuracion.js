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

export const actualizarEstadoClases = () => {
  return api.post('/api/configuracion/actualizar-estado-clases').then(r => r.data);
};

export const getEstadoClasesCronConfig = () => {
  return api.get('/api/configuracion/estado-clases-cron').then(r => r.data);
};

export const updateEstadoClasesCronConfig = (config) => {
  return api.put('/api/configuracion/estado-clases-cron', config).then(r => r.data);
};


