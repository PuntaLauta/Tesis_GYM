import api from './api';

export const registerAccess = (socioId, documento) => {
  if (documento) {
    return api.post('/api/accesos', { documento }).then(r => r.data);
  }
  return api.post('/api/accesos', { socio_id: socioId }).then(r => r.data);
};

export const verifyByToken = (token) => {
  return api.get(`/api/access/verify?token=${token}`).then(r => r.data);
};

export const enterByToken = (token) => {
  return api.post('/api/access/enter', { token }).then(r => r.data);
};

