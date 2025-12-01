import api from './api';

export const listFavoritos = () => {
  return api.get('/api/ejercicios/favoritos').then(r => r.data);
};

export const addFavorito = (data) => {
  return api.post('/api/ejercicios/favoritos', data).then(r => r.data);
};

export const removeFavorito = (id) => {
  return api.delete(`/api/ejercicios/favoritos/${id}`).then(r => r.data);
};


