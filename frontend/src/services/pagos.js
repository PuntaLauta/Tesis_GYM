import api from './api';

export const listMyPayments = () => {
  return api.get('/api/pagos/mios').then(r => r.data);
};

export const listAllPayments = () => {
  return api.get('/api/pagos').then(r => r.data);
};

export const createPayment = (socio_id, monto, metodo_pago) => {
  return api.post('/api/pagos', { socio_id, monto, metodo_pago }).then(r => r.data);
};

