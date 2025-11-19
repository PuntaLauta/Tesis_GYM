import api from './api';

export const listMyPayments = () => {
  return api.get('/api/pagos/mios').then(r => r.data);
};

