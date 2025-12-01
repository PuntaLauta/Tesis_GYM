import api from './api';

export const sendMessage = (mensaje, tipo = 'general', contexto = {}) => {
  return api.post('/api/asistente/chat', {
    mensaje,
    tipo,
    contexto,
  }).then(r => r.data);
};

export const getConversaciones = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/api/asistente/conversaciones${queryString ? '?' + queryString : ''}`).then(r => r.data);
};

export const deleteConversacion = (id) => {
  return api.delete(`/api/asistente/conversaciones/${id}`).then(r => r.data);
};

export const deleteAllConversaciones = () => {
  return api.delete('/api/asistente/conversaciones').then(r => r.data);
};


