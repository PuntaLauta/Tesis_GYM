import api from './api';

export const listPlanes = () => {
  return api.get('/api/planes').then(r => r.data);
};

export const getPlan = (id) => {
  return api.get(`/api/planes/${id}`).then(r => r.data);
};

