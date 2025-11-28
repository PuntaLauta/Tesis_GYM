import api from './api';

export const listBackups = () => {
  return api.get('/api/backup').then(r => r.data);
};

export const createBackup = () => {
  return api.post('/api/backup').then(r => r.data);
};

export const restoreBackup = (nombre, tipo) => {
  return api.post('/api/backup/restore', { nombre, tipo }).then(r => r.data);
};

export const deleteBackup = (nombre, tipo) => {
  return api.delete(`/api/backup/${nombre}?tipo=${tipo}`).then(r => r.data);
};

export const getBackupConfig = () => {
  return api.get('/api/backup/config').then(r => r.data);
};

export const updateBackupConfig = (config) => {
  return api.put('/api/backup/config', config).then(r => r.data);
};

export const cleanupBackups = () => {
  return api.post('/api/backup/cleanup').then(r => r.data);
};

