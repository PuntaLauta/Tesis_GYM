import api from './api';

export const listInstructores = () => {
  return api.get('/api/instructores').then(r => r.data);
};

export const getInstructor = (id) => {
  return api.get(`/api/instructores/${id}`).then(r => r.data);
};

export const createInstructor = (data) => {
  return api.post('/api/instructores', data).then(r => r.data);
};

export const updateInstructor = (id, data) => {
  return api.put(`/api/instructores/${id}`, data).then(r => r.data);
};

export const deleteInstructor = (id) => {
  return api.delete(`/api/instructores/${id}`).then(r => r.data);
};

export const getClasesInstructor = (id, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/api/instructores/${id}/clases${queryParams ? '?' + queryParams : ''}`).then(r => r.data);
};

export const getSociosClase = (instructorId, claseId) => {
  return api.get(`/api/instructores/${instructorId}/clases/${claseId}/socios`).then(r => r.data);
};

export const updateInstructorProfile = (data) => {
  return api.put('/api/instructores/me', data).then(r => r.data);
};

export const changePasswordInstructor = (usuarioId, password) => {
  return api.put(`/api/usuarios/${usuarioId}/password`, { password }).then(r => r.data);
};

