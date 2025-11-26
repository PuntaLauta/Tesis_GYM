import api from './api';

export const listPlanes = () => {
  return api.get('/api/planes').then(r => r.data);
};

export const getPlan = (id) => {
  return api.get(`/api/planes/${id}`).then(r => r.data);
};

export const createPlan = (nombre, duracion, precio) => {
  return api.post('/api/planes', { nombre, duracion, precio }).then(r => r.data);
};

export const updatePlan = (id, nombre, duracion, precio) => {
  return api.put(`/api/planes/${id}`, { nombre, duracion, precio }).then(r => r.data);
};

export const deletePlan = (id) => {
  return api.delete(`/api/planes/${id}`).then(r => r.data);
};

