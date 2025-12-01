import api from './api';

export const getConfiguracion = () => {
  return api.get('/api/configuracion').then(r => r.data);
};

export const updateConfiguracion = (config) => {
  return api.put('/api/configuracion', config).then(r => r.data);
};



