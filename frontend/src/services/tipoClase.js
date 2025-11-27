import api from './api';

export const listTiposClase = () => {
  return api.get('/api/tipo-clase').then(r => r.data);
};

