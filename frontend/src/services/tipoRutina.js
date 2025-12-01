import api from './api';

export const listTipoRutinas = () => {
  return api.get('/api/tipo-rutina').then(r => r.data);
};

