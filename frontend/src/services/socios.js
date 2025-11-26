import api from './api';

export const listSocios = (search) => {
  const params = search ? { search } : {};
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/api/socios${queryString ? '?' + queryString : ''}`).then(r => r.data);
};

export const getSocio = (id) => {
  return api.get(`/api/socios/${id}`).then(r => r.data);
};

export const getMySocio = async () => {
  try {
    const response = await api.get('/api/socios');
    const data = response.data;
    if (data.data && data.data.length > 0) {
      return { data: data.data[0] };
    }
    return { data: null };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { data: null };
    }
    throw error;
  }
};

export const createSocio = (data) => {
  return api.post('/api/socios', data).then(r => r.data);
};

export const updateSocio = (id, data) => {
  return api.put(`/api/socios/${id}`, data).then(r => r.data);
};

export const deleteSocio = (id) => {
  return api.delete(`/api/socios/${id}`).then(r => r.data);
};

export const downloadQr = async (id) => {
  const response = await api.get(`/api/socios/${id}/qr.png`, {
    responseType: 'blob',
  });
  return response.data;
};

export const rotateQr = (id) => {
  return api.post(`/api/socios/${id}/qr/rotate`).then(r => r.data);
};

