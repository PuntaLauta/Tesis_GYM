import api from './api';

export const listClasses = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/clases?${queryParams}`).then(r => r.data);
};

export const getClass = (id) => {
  return api.get(`/api/clases/${id}`).then(r => r.data);
};

export const createClass = (data) => {
  return api.post('/api/clases', data).then(r => r.data);
};

export const updateClass = (id, data) => {
  return api.put(`/api/clases/${id}`, data).then(r => r.data);
};

export const cancelClass = (id) => {
  return api.delete(`/api/clases/${id}`).then(r => r.data);
};

