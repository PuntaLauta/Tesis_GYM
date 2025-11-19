import api from './api';

export const listByClass = (claseId) => {
  return api.get(`/api/reservas?clase_id=${claseId}`).then(r => r.data);
};

export const listMine = () => {
  return api.get('/api/reservas/mias').then(r => r.data);
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



