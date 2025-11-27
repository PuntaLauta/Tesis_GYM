import api from './api';

export const listByClass = (claseId) => {
  return api.get(`/api/reservas?clase_id=${claseId}`).then(r => r.data);
};

export const listMine = () => {
  return api.get('/api/reservas/mias').then(r => r.data);
};

export const listAll = () => {
  return api.get('/api/reservas').then(r => r.data);
};

export const listReservations = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.clase_id) {
    params.append('clase_id', filters.clase_id);
  }
  if (filters.tipo_clase_id) {
    params.append('tipo_clase_id', filters.tipo_clase_id);
  }
  if (filters.fecha) {
    params.append('fecha', filters.fecha);
  }
  const queryString = params.toString();
  return api.get(`/api/reservas${queryString ? '?' + queryString : ''}`).then(r => r.data);
};

export const createReservation = (data) => {
  return api.post('/api/reservas', data).then(r => r.data);
};

export const cancelReservation = (id) => {
  return api.put(`/api/reservas/${id}/cancelar`).then(r => r.data);
};

export const markAttendance = (id, estado) => {
  return api.put(`/api/reservas/${id}/asistencia`, { estado }).then(r => r.data);
};



