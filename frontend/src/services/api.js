import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true, // importante para cookies de sesión
});

export default api;
