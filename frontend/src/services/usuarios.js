import api from './api';

export const listUsuarios = () => {
  return api.get('/api/usuarios').then(r => r.data);
};

export const getUsuario = (id) => {
  return api.get(`/api/usuarios/${id}`).then(r => r.data);
};

export const createUsuario = (nombre, email, password, rol) => {
  return api.post('/api/usuarios', { nombre, email, password, rol }).then(r => r.data);
};

export const updateUsuario = (id, nombre, email, rol) => {
  return api.put(`/api/usuarios/${id}`, { nombre, email, rol }).then(r => r.data);
};

export const changePasswordUsuario = (id, password) => {
  return api.put(`/api/usuarios/${id}/password`, { password }).then(r => r.data);
};

export const deleteUsuario = (id) => {
  return api.delete(`/api/usuarios/${id}`).then(r => r.data);
};

