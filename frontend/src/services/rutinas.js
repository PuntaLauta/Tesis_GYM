import api from './api';

export const listRutinas = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/api/rutinas${queryString ? '?' + queryString : ''}`).then(r => r.data);
};

export const getRutina = (id) => {
  return api.get(`/api/rutinas/${id}`).then(r => r.data);
};

export const createRutina = (data) => {
  return api.post('/api/rutinas', data).then(r => r.data);
};

export const updateRutina = (id, data) => {
  return api.put(`/api/rutinas/${id}`, data).then(r => r.data);
};

export const deleteRutina = (id) => {
  return api.delete(`/api/rutinas/${id}`).then(r => r.data);
};

export const toggleActiva = (id, activa) => {
  return api.put(`/api/rutinas/${id}/activar`, { activa }).then(r => r.data);
};

export const generarRutina = (data) => {
  return api.post('/api/rutinas/generar', data).then(r => r.data);
};

