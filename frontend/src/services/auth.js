import api from "./api";

export const me = () => api.get("/auth/me").then(r => r.data);
export const login = (email, password) => api.post("/auth/login", { email, password }).then(r => r.data);
export const logout = () => api.post("/auth/logout").then(r => r.data);
export const changePassword = (currentPassword, newPassword) => {
  return api.put('/auth/me/password', { currentPassword, newPassword }).then(r => r.data);
};

// Preguntas de seguridad
export const setSecurityQuestion = (pregunta, respuesta) => {
  return api.post('/auth/security-question', { pregunta, respuesta }).then(r => r.data);
};

export const getSecurityQuestion = (email) => {
  return api.get(`/auth/security-question/${email}`).then(r => r.data);
};

export const getMySecurityQuestion = () => {
  return api.get('/auth/me/security-question').then(r => r.data);
};

export const verifySecurityAnswer = (email, respuesta) => {
  return api.post('/auth/verify-security-answer', { email, respuesta }).then(r => r.data);
};

export const recoverPassword = (email, respuesta, newPassword) => {
  return api.post('/auth/recover-password', { email, respuesta, newPassword }).then(r => r.data);
};



